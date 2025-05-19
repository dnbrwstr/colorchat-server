require('./helpers/configure');

var sinon = require('sinon'),
  expect = require('chai').expect,
  request = require('supertest'),
  Promise = require('bluebird'),
  app = require('../src/api').default,
  db = require('../src/lib/db').default,
  User = require('../src/models/User').default,
  twilio = require('../src/lib/twilio').default,
  mapTimes = require('../src/lib/FnUtils').mapTimes;

var defaultNumberData = {
  baseNumber: '4013911814',
  countryCode: '1'
};

var defaultPhoneNumber = '+14013911814';

describe('auth', function () {
  var agent;
  var sendConfirmationCodeStub;
  var checkConfirmationCodeStub;

  before(function (done) {
    agent = request.agent(app);
    sendConfirmationCodeStub = sinon.stub(twilio, 'sendConfirmationCode').resolves()
    checkConfirmationCodeStub = sinon.stub(twilio, 'checkConfirmationCode').resolves()

    db.options.logging = null;

    db.sync({ force: true }).then(function () {
      done();
    });
  });

  describe('/auth', function () {
    it('Throws an error if no phone number is passed', function (done) {
      agent.post('/auth')
        .send({ baseNumber: '', countryCode: '1' })
        .expect(400)
        .end(done);
    });

    it('Attempts to verify if a message is sent successfully', function (done) {
      agent.post('/auth')
        .send(defaultNumberData)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          expect(sendConfirmationCodeStub.calledOnce).to.equal(true);
          done();
        });
    });

    it('Throws an error if the Twilio request fails', function (done) {
      sendConfirmationCodeStub.rejects(new Error());

      agent.post('/auth')
        .send(defaultNumberData)
        .expect(500)
        .end(function (err, res) {
          sendConfirmationCodeStub.resolves();
          done(err);
        });
    });
  });

  describe('/auth/confirm', function () {
    beforeEach(function (done) {
      db.sync({ force: true }).then(function () { done(); });
    });

    it('Throws an error if invalid credentials are submitted', function (done) {
      checkConfirmationCodeStub.resolves({
        status: 'pending'
      });
      twilio.checkConfirmationCode().then(console.log.bind(console));
      agent.post('/auth/confirm')
        .send({
          phoneNumber: defaultPhoneNumber,
          code: '555554'
        })
        .expect(403)
        .end(() => {
          checkConfirmationCodeStub.resolves()
          done();
        });
    });

    it('Creates a new user if valid credentials are submitted', function (done) {
      checkConfirmationCodeStub.resolves({
        status: 'approved'
      });
      agent.post('/auth/confirm')
        .send({
          phoneNumber: defaultPhoneNumber,
          code: '555555'
        })
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          expect(res.body).to.have.key('user');
          expect(res.body.user).to.have.all.keys(['token', 'phoneNumber', 'id']);
          done();
        });
    });

    it('Adds token to existing user if possible', function (done) {
      User.create({
        phoneNumber: defaultPhoneNumber,
        tokens: ['aaa']
      }).then(function () {
        agent.post('/auth/confirm')
          .send({
            phoneNumber: defaultPhoneNumber,
            code: '555555'
          })
          .end(function () {
            User.findAll().then(function (users) {
              expect(users.length).to.equal(1);
              expect(users[0].tokens.length).to.equal(2);
              done();
            });
          });
      });
    });
  });
});
