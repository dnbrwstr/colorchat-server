let express = require('express'),
  twilio = require('../lib/twilio'),
  wrapAsyncRoute = require('../lib/wrapAsyncRoute'),
  ConfirmationCode = require('../models/ConfirmationCode'),
  User = require('../models/User');

import { RequestError } from '../lib/errors';

let app = express();

app.post('/', wrapAsyncRoute(async function (req, res, next) {
  let number = req.body.phoneNumber;

  if (!number) {
    throw new RequestError('Missing phone number');
  }

  let confirmation = await ConfirmationCode.createOrUpdateFromNumber(number);

  await twilio.sendConfirmationCode({
    code: confirmation.code,
    phoneNumber: confirmation.phoneNumber
  });

  res.status(200).send();
}));

app.post('/confirm', wrapAsyncRoute(async function (req, res, next) {
  let { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    throw new RequestError('Missing required input');
  }

  let confirmation = await ConfirmationCode.attemptValidationWhere({
    phoneNumber: phoneNumber,
    code: code.toString()
  });

  let user = await User.createOrUpdateFromConfirmation(confirmation);

  res.json({
    user: {
      id: user.id,
      token: user.tokens.pop(),
      phoneNumber: user.phoneNumber
    }
  });
}));

module.exports = app;