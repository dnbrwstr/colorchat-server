require('./helpers/configure');

var sinon = require('sinon'),
  R = require('ramda'),
  io = require('socket.io-client'),
  expect = require('chai').expect,
  request = require('supertest'),
  Promise = require('bluebird'),
  amqp = require('amqplib'),
  exec = require('child_process').exec,
  db = require('../src/lib/db').default,
  User = require('../src/models/User').default,
  createServer = require('../src/lib/createServer').default;

var testUserData = [{
  phoneNumber: '+14013911814',
  tokens: ['123']
}, {
  phoneNumber: '+14013911815',
  tokens: ['456']
}, {
  phoneNumber: '+17777777777',
  tokens: ['789'],
  blockedUsers: [1]
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

  var resetPendingMessages = function () {
    return amqp.connect().then(function (connection) {
      return connection.createChannel().then(function (channel) {
        return channel.assertQueue('user-1')
          .then(function () { return channel.assertQueue('user-2'); })
          .then(function () { return channel.purgeQueue('user-1'); })
          .then(function () { return channel.purgeQueue('user-2'); })
        });
    });
  };

  beforeEach(function (done) {
    db.options.logging = null;

    resetPendingMessages()
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
      secondClient.on('messagedata', function () {
        done(new Error('Second client should not receive own message'))
      }); 

      firstClient.on('messagedata', function (data, cb) {
        cb && cb();
        done();
      });
    });

    var firstClient = clientForUser(0).on('ready', cb);
    var secondClient = clientForUser(1).on('ready', cb);
  });

  it('Stores message if recipient isnt available', function (done) {
    var client = clientForUser(0);
    var messageData = createMessage(0, 1);

    client.on('connect', function () {
      client.emit('messagedata', messageData, function () {
        var partnerClient = clientForUser(1);

        partnerClient.on('messagedata', function (data, cb) {
          cb && cb();
          done();
        });
      });
    });
  });

  it("Requeues a message if not acked", function (done) {
    this.timeout(10000);

    var cb = runOnAttempt(2, function () {
      secondClient.emit('messagedata', createMessage(1, 0));
      secondClient.on('messagedata', function (data) {
        done(new Error('Second client should not receive own message'))
      });

      firstClient.on('messagedata', function (data, cb) {
        firstClient.close();
      });

      setTimeout(() => {
        const newFirstClient = clientForUser(0);
        newFirstClient.on('messagedata', (data, cb) => {
          cb && cb();
          done();
        });
      }, 6000);
    });

    var firstClient = clientForUser(0).on('ready', cb);
    var secondClient = clientForUser(1).on('ready', cb);
  })

  it('Passes pending messages when client connects', function (done) {
    this.timeout(5000);

    var firstClient = clientForUser(0).on('connect', function () {
      firstClient.emit('messagedata', createMessage(0, 1), cb);

      setTimeout(function () {
        firstClient.emit('messagedata', createMessage(0, 1), cb);
      }, 1500);
    });

    var cb = runOnAttempt(2, function () {
      var doneCb = runOnAttempt(2, done);

      clientForUser(1).on('messagedata', function (data, ack) {
        ack && ack();
        doneCb();
      });
    });
  });

  it('Respects blocked numbers', function (done) {
    this.timeout(5000);
    var firstClient = clientForUser(0).on('ready', function () {
      firstClient.emit('messagedata', createMessage(0, 2), function () {
        setTimeout(done, 2000);
      });
    });

    var secondClient = clientForUser(2).on('ready', function () {
      secondClient.on('messagedata', function (m) {
        done(new Error('Message from blocked user should not be delivered'))
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