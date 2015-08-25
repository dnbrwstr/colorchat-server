require('dotenv').load();
require('babel/register');
require('./lib/promisify');

var Sequelize = require('./lib/Sequelize'),
  createServer = require('./lib/createServer');

Sequelize.sync().then(function () {
  createServer();
});
