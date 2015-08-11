let express = require('express'),
  twilio = require('../lib/twilio'),
  wrapAsyncRoute = require('../lib/wrapAsyncRoute'),
  RequestError = require('../lib/errors').Request,
  NumberConfirmation = require('../models/NumberConfirmation'),
  User = require('../models/User');

let app = express();

app.post('/', wrapAsyncRoute(async function (req, res, next) {
  let number = req.body.number;
  let code = Math.floor(Math.random() * 999999).toString();

  if (!number) {
    throw new RequestError('Missing phone number');
  }

  let confirmation = await NumberConfirmation.create({
    number: number,
    code: code
  });

  await twilio.sendConfirmationCode({
    code: confirmation.code,
    number: confirmation.number
  });

  res.status(200).send();
}));

app.post('/confirm', wrapAsyncRoute(async function (req, res, next) {
  if (!req.body.number || !req.body.code) {
    throw new RequestError('Missing required input');
  }

  let confirmation = await NumberConfirmation.attemptValidationWhere({
    number: req.body.number,
    code: req.body.code
  });

  let user = await User.createFromConfirmation(confirmation);

  res.json({
    token: user.tokens.pop()
  });
}));

module.exports = app;