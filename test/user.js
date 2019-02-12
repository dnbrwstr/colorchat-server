require('./helpers/configure');

var expect = require('chai').expect,
  request = require('supertest'),
  app = require('../src/api').default,
  db = require('../src/lib/db').default,
  User = require('../src/models/User').default;

var authToken = 'abc';
var phoneNumber = '+14014444444';

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
        phoneNumber: phoneNumber,
        tokens: [authToken],
        avatar: "#EFEFEF"
      }).then(function (_user) {
        user = _user;
        done();
      });
    });
  });

  it('Returns user avatar', function (done) {
    agent.get('/user/' + phoneNumber + '/avatar')
      .set(authHeaders)
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        var user = res.body;
        expect(user).to.have.keys(['avatar']);
        done();
      })
  })
});