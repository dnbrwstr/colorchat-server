require('./helpers/configure');

var sinon = require('sinon'),
  expect = require('chai').expect,
  request = require('supertest'),
  Promise = require('bluebird'),
  app = require('../src/api').default,
  db = require('../src/lib/db').default,
  User = require('../src/models/User').default,
  DeviceToken = require('../src/models/DeviceToken').default;

var authToken = 'abc';

var authHeaders = {
  'x-auth-token': authToken
};

describe('account', function () {
  var agent;
  var user;

  before(function (done) {
    agent = request.agent(app);
    db.options.logging = null;

    db.sync({ force: true}).then(function () {
      User.create({
        phoneNumber: '+14014444444',
        tokens: [authToken]
      }).then(function (_user) {
        user = _user;
        done();
      });
    });
  });

  it('Returns user inf', function (done) {
    agent.get('/account')
      .set(authHeaders)
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        var user = res.body;
        expect(user).to.have.keys(['id', 'name', 'phoneNumber', 'avatar']);
        expect(user).to.not.have.keys(['tokens', 'deviceTokens']);
        done();
      })
  })

  it('Updates the device token', function (done) {
    agent.put('/account')
      .set(authHeaders)
      .send({
        deviceToken: '456'
      })
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;

        user.reload({ include: [{model: DeviceToken, as: 'pushTokens' }] }).then(function (user) {
          expect(user.pushTokens.length).to.equal(1);
          expect(user.pushTokens[0].token).to.equal('456');
          done();
        });
      })
  });

  it('Destroys a user account', function (done) {
    agent.delete('/account')
      .set(authHeaders)
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;

        User.findAll().then(function (users) {
          expect(users.length).to.equal(0);
          done();
        });
      });
  });
});