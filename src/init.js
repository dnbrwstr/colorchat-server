// This file should remain vanilla JS as only
// files required after babel are transpiled
require('dotenv').load();
require('babel-register');
require('babel-polyfill');
require('./lib/promisify');

var db = require('./lib/db').default,
  createServer = require('./lib/createServer').default;

db.sync().then(function () {
  createServer(process.env.PORT);
});
