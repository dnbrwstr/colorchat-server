require('./helpers/configure');

var sinon = require('sinon'),
  R = require('ramda'),
  redis = require('redis'),
  io = require('socket.io-client'),
  sinonAsPromised = require('sinon-as-promised'),
  expect = require('chai').expect,
  request = require('supertest-as-promised'),
  Promise = require('bluebird'),
  db = require('../src/lib/db'),
  User = require('../src/models/User'),
  createServer = require('../src/lib/createServer'),
  createRedisClient = require('../src/lib/createRedisClient');

var redisClient = redis.createClient(process.env.REDIS_URL);
var appRedisClient = createRedisClient();

var testUserData = [{
  number: '+14013911814',
  tokens: ['123']
}, {
  number: '+14013911814',
  tokens: ['456']
}];

var baseSocketOptions = {
  transports: ['websocket'],
  'force new connection': true,
}

var socketOptionsWithToken = function (token) {
  return R.merge(baseSocketOptions, {
    query: 'token=' + token
  });
};

var runOnAttempt = function (number, cb) {
  var called = 0;

  return function () {
    ++called;
    if (called === number) cb();
  }
};

describe('messaging', function () {
  var users;
  var clients = [];
  var portA = parseInt(process.env.PORT) || 3000;
  var portB = portA + 1;
  var serverA = createServer(portA);
  var serverB = createServer(portB);

  var connectWithOptions = function (options) {
    // Distribute clients between servers
    var port = clients.length % 2 === 1 ? portA : portB;
    var url = 'http://localhost:' + port;
    var client = io(url, options);
    clients.push(client);
    return client;
  }

  var socketOptionsForUser = function (userIndex) {
    return socketOptionsWithToken(users[userIndex].tokens[0])
  };

  var clientForUser = function (userIndex) {
    return connectWithOptions(socketOptionsForUser(userIndex));
  };

  var createMessage = function (senderIndex, recipientIndex) {
    return {
      senderId: users[senderIndex].id,
      recipientId: users[recipientIndex].id
    };
  };

  beforeEach(function (done) {
    db.options.logging = null;

    redisClient.flushdbAsync()
      .then(function () {
        return db.sync({ force: true});
      })
      .then(function () {
        return User.bulkCreate(testUserData);
      })
      .then(function () {
        // db doesn't return autoincremented
        // ids after bulk create
        return User.findAll()
      })
      .then(function (_users) {
        users = _users;
        done();
      });
  });

  it('Requires token in query string', function (done) {
    var client = connectWithOptions(baseSocketOptions);

    client.on('connect', function () {
      done(new Error('Should not be able to connect'))
    });

    client.on('error', function () {
      done();
    });
  });

  it('Rejects invalid tokens', function (done) {
    var client = connectWithOptions(socketOptionsWithToken('xyz'));

    client.on('connect', function () {
      done(new Error('Should not be able to connect'))
    });

    client.on('error', function () {
      done();
    });
  });

  it('Grants access to authenticated user', function (done) {
    var client = clientForUser(0);

    client.on('connect', function () {
      done();
    });
  });

  it('Sends a message', function (done) {
    var cb = runOnAttempt(2, function () {
      secondClient.emit('messagedata', createMessage(1, 0));

      secondClient.on('messagedata', function (message) {
        done(new Error('Second client should not receive own message'))
      });

      firstClient.on('messagedata', function (message) {
        done();
      });
    });

    var firstClient = clientForUser(0).on('messagedata', cb);
    var secondClient = clientForUser(1).on('messagedata', cb);
  });

  it('Stores message if recipient isnt available', function (done) {
    var client = clientForUser(0);

    var messageData = createMessage(0, 1);

    client.on('connect', function () {
      client.emit('messagedata', messageData, function (m) {
        appRedisClient.getPendingMessages(users[1].id).then(function (messages) {
          expect(messages.length).to.equal(1);
          done();
        });
      });
    });
  });

  it('Passes pending messages when client connects', function (done) {
    var firstClient = clientForUser(0).on('connect', function () {
      firstClient.emit('messagedata', createMessage(0, 1), cb);
      firstClient.emit('messagedata', createMessage(0, 1), cb);
      firstClient.emit('messagedata', createMessage(0, 1), cb);
    });

    var cb = runOnAttempt(3, function () {
      clientForUser(1).on('messagedata', function (messages, cb) {
        expect(messages.length).to.equal(3);
        done();
      });
    });
  });

  afterEach(function (done) {
    clients.forEach(function (client) {
      client.disconnect();
    });

    clients = [];
    done();
  });
});