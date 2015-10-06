require('./helpers/configure');

var sinon = require('sinon'),
  sinonAsPromised = require('sinon-as-promised'),
  expect = require('chai').expect,
  request = require('supertest-as-promised'),
  Promise = require('bluebird'),
  app = require('../src/api'),
  db = require('../src/lib/db'),
  User = require('../src/models/User');

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

  it('Updates the device token', function (done) {
    agent.put('/account')
      .set(authHeaders)
      .send({
        deviceToken: '456'
      })
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;

        user.reload().then(function (user) {
          expect(user.deviceTokens.length).to.equal(1);
          expect(user.deviceTokens[0]).to.equal('456');
          done();
        });
      })
  });
});