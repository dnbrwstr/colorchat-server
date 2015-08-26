// This file should remain vanilla JS as only
// files required after babel are transpiled
require('dotenv').load();
require('babel/register');
require('./lib/promisify');

var db = require('./lib/db'),
  createServer = require('./lib/createServer');

Sequelize.sync().then(function () {
  createServer();
});
