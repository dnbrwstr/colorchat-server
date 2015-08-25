let express = require('express'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  morgan = require('morgan'),
  authApp = require('./auth'),
  matchApp = require('./match'),
  logError = require('../lib/logError'),
  RequestError = require('../lib/errors').Request;

let app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(morgan('dev'));

app.use(bodyParser.json());

app.use('/auth', authApp);
app.use('/match', matchApp)

app.use(function (err, req, res, next) {
  logError(err);
  res.status(err.status || 500).send('Something bad happened');
});

module.exports = app;
