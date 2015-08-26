require('./helpers/configure');

var sinon = require('sinon'),
  sinonAsPromised = require('sinon-as-promised'),
  expect = require('chai').expect,
  request = require('supertest-as-promised'),
  Promise = require('bluebird'),
  app = require('../src/apps/main'),
  sequelize = require('../src/lib/sequelize'),
  NumberConfirmation = require('../src/models/NumberConfirmation'),
  User = require('../src/models/User'),
  twilio = require('../src/lib/twilio'),
  mapTimes = require('../src/lib/Util').mapTimes;

var defaultNumberData = {
  number: '+14013911814'
};

describe('auth', function () {
  var agent;

  before(function (done) {
    agent = request.agent(app);
    sequelize.options.logging = null;

    sequelize.sync({ force: true}).then(function () {
      done();
    });
  });

  describe('/auth', function () {
    var sendConfirmationCodeStub;

    before(function () {
      sendConfirmationCodeStub = sinon.stub(twilio, 'sendConfirmationCode').resolves();
    });

    it('Throws an error if no phone number is passed', function (done) {
      agent.post('/auth')
        .send({number: ''})
        .expect(400)
        .end(done);
    });

    it('Creates a NumberConfirmation if a message is sent successfully', function (done) {
      agent.post('/auth')
        .send(defaultNumberData)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          return NumberConfirmation.findAll().then(function (confirmations) {
            expect(confirmations.length).to.equal(1);
            done();
          });
        });
    });

    it('Updates confirmation code when additional requests are sent', function (done) {
      NumberConfirmation.find(defaultNumberData).then(function (confirmation) {
        var startCode = confirmation.code;

        agent.post('/auth')
          .send(defaultNumberData)
          .end(function () {
            NumberConfirmation.findAll({ where: defaultNumberData }).then(function (res) {
              expect(res.length).to.equal(1);
              expect(res[0].code).to.not.equal(startCode);
              done();
            });
          });
      });
    });

    it('Throws an error if the Twilio request fails', function (done) {
      sendConfirmationCodeStub.rejects(new Error());

      agent.post('/auth')
        .send(defaultNumberData)
        .expect(500)
        .end(function (err, res) {
          sendConfirmationCodeStub.restore();
          done(err);
        });
    });

    it('Locks code creation after 20 attempts', function (done) {
      Promise.all(mapTimes(21, function () {
        return agent.post('/auth')
          .send(defaultNumberData)
      })).catch(function () {
        NumberConfirmation.find({where: defaultNumberData}).then(function (res) {
          expect(res.numberLocked).to.be.ok
          done();
        });
      });
    });
  });

  describe('/auth/confirm', function () {
    beforeEach(function (done) {
      sequelize.sync({ force: true}).then(function () {
        NumberConfirmation.bulkCreate([{
          number: '+14013911814',
          code: '555555'
        }, {
          number: '+15555555',
          code: '666666'
        }]).then(function () {
          done();
        });
      });
    });

    it('Throws an error if invalid credentials are submitted', function (done) {
      agent.post('/auth/confirm')
        .send({
          number: '+14013911814',
          code: '555554'
        })
        .expect(403)
        .end(done);
    });

    it('Creates a new user if valid credentials are submitted', function (done) {
      agent.post('/auth/confirm')
        .send({
          number: '+14013911814',
          code: 555555
        })
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body).to.have.key('user');
          expect(res.body.user).to.have.all.keys(['token', 'number', 'id']);
          done();
        });
    });

    it('Adds token to existing user if possible', function (done) {
      User.create({
        number: '+14013911814',
        tokens: ['aaa']
      }).then(function () {
        agent.post('/auth/confirm')
          .send({
            number: '+14013911814',
            code: '555555'
          })
          .end(function () {
            User.findAll().then(function (users) {
              expect(users.length).to.equal(1);
              expect(users[0].tokens.length).to.equal(2);
              done();
            })
          });
      });
    });

    it('Locks code after 6 failed attempts to confirm', function (done) {
      Promise.all(mapTimes(7, function () {
        return agent.post('/auth/confirm')
          .send({
            number: '+15555555',
            code: '555555'
          });
      })).catch(function () {
        return NumberConfirmation.find({
          where: {
            number: '+15555555'
          }
        }).then(function (res) {
          expect(res.codeLocked).to.be.ok
          done();
        });
      });
    });
  });
});
