import express from 'express';
import twilio from '../lib/twilio';
import wrapAsyncRoute from '../lib/wrapAsyncRoute';
import { validate } from '../lib/PhoneNumberUtils';
import ConfirmationCode from '../models/ConfirmationCode';
import User from '../models/User';
import { RequestError } from '../lib/errors';

let app = express();

app.post('/', wrapAsyncRoute(async function (req, res, next) {
  let { baseNumber, countryCode } = req.body;

  if (!baseNumber) {
    throw new RequestError('Missing phone number');
  }

  if (!countryCode) {
    throw new RequestError('Missing country code');
  }

  let isValidNumber = validate(baseNumber, countryCode);
  if (!isValidNumber) {
    throw new RequestError('Not a valid phone number');
  }

  let phoneNumber = `+${countryCode}${baseNumber}`;
  let confirmation = await ConfirmationCode.createOrUpdateFromNumber(phoneNumber);

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

app.post('/call', function () {
  let { phoneNumber } = req.body;

  twilio.callWithConfirmationCode({
    code: confirmation.code,
    phoneNumber: confirmation.phoneNumber
  });
});



export default app;
