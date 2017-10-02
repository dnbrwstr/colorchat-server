require('dotenv').load();
require('babel-register');
require('babel-polyfill');
require('./src/lib/promisify');
require('./gulp');
