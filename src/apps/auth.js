let express = require('express'),
  twilio = require('../lib/twilio'),
  wrapAsyncRoute = require('../lib/wrapAsyncRoute'),
  NumberConfirmation = require('../models/NumberConfirmation'),
  User = require('../models/User');

import { RequestError } from '../lib/errors';

let app = express();

app.post('/', wrapAsyncRoute(async function (req, res, next) {
  let number = req.body.number;

  if (!number) {
    throw new RequestError('Missing phone number');
  }

  let confirmation = await NumberConfirmation.createOrUpdateFromNumber(number);

  await twilio.sendConfirmationCode({
    code: confirmation.code,
    number: confirmation.number
  });

  res.status(200).send();
}));

app.post('/confirm', wrapAsyncRoute(async function (req, res, next) {
  let { number, code } = req.body;

  if (!number || !code) {
    throw new RequestError('Missing required input');
  }

  let confirmation = await NumberConfirmation.attemptValidationWhere({
    number: number,
    code: code.toString()
  });

  let user = await User.createFromConfirmation(confirmation);

  res.json({
    user: {
      id: user.id,
      token: user.tokens.pop(),
      number: user.number
    }
  });
}));

module.exports = app;