let express = require('express'),
  bodyParser = require('body-parser'),
  authApp = require('./auth'),
  matchApp = require('./match'),
  RequestError = require('../lib/errors').Request;

let app = express();

app.use(bodyParser.json());

app.use('/auth', authApp);
app.use('/match', matchApp)

app.use(function (err, req, res, next) {
  console.log(err.message, err.stack);
  res.status(err.status || 500).send('Something bad happened');
});

module.exports = app;
