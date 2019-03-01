// This file should remain vanilla JS as only
// files required after babel are transpiled
require('dotenv').load();
require('babel-register');
require('babel-polyfill');
require('./lib/promisify');
require('./init');
