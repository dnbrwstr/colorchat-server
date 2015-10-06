require('./helpers/configure');

var sinon = require('sinon'),
  sinonAsPromised = require('sinon-as-promised'),
  expect = require('chai').expect,
  request = require('supertest-as-promised'),
  Promise = require('bluebird'),
  app = require('../src/api'),
  db = require('../src/lib/db'),
  User = require('../src/models/User');

var numbersWithMatching = [
  ["555-5512","888-555-1212"],
  ["(555) 564-8583","(415) 555-3695"],
  ["555-522-8243"],
  ["555-478-7672","(408) 555-5270","(408) 555-3514"],
  ["555-610-6679"],
  ["(555) 766-4823","(707) 555-1854"]
];

var numbersWithoutMatching = [
  ["(555) 564-8583","(415) 555-3695"],
  ["555-522-8243"],
  ["(555) 766-4823","(707) 555-1854"]
];

var users = [
  {
    phoneNumber: '+18885551212',
    tokens: ['222222']
  }, {
    phoneNumber: '+14085553514',
    tokens: ['333333']
  }, {
    phoneNumber: '+15556106679',
    tokens: ['444444']
  }, {
    phoneNumber: '+15555555',
    tokens: ['555555']
  }
]

var authHeaders = {
  'x-auth-token': '222222'
};

describe('Contact matching', function () {
  var agent;

  before(function (done) {
    agent = request.agent(app);
    // db.options.logging = null;

    db.sync({ force: true}).then(function () {
      User.bulkCreate(users).then(function () {
        done();
      });
    });
  });

  describe('/match', function (done) {
    it('Requires authentication', function (done) {
      agent.post('/match')
        .send({ contacts: numbersWithMatching })
        .expect(403)
        .end(done);
    });

    it('Returns matches if they exist', function (done) {
      agent.post('/match')
        .set(authHeaders)
        .send({ phoneNumbers: numbersWithMatching })
        .expect(200)
        .end(function (err, res) {
          if (err) done(err);

          var indexes = res.body.map(function (m) {
            return m.index;
          });

          expect(indexes).to.deep.equal([0,3,4]);
          done();
        })
    });

    it('Returns an empty array if no matches exist', function (done) {
      agent.post('/match')
        .set(authHeaders)
        .send({ phoneNumbers: numbersWithoutMatching })
        .expect(200)
        .end(function (err, res) {
          if (err) done(err);
          expect(res.body).to.deep.equal([]);
          done();
        });
    });
  });
});
