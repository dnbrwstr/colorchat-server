require('dotenv').load();
require('babel/register');
require('./lib/promisify');

var db = require('./lib/db'),
  createServer = require('./lib/createServer');

Sequelize.sync().then(function () {
  createServer();
});
