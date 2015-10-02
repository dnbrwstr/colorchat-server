import express from 'express';
import validate from 'express-validation';
import Joi from 'joi';
import twilio from '../lib/twilio';
import wrapAsyncRoute from '../lib/wrapAsyncRoute';
import { validate as validateNumber, normalize } from '../lib/PhoneNumberUtils';
import ConfirmationCode from '../models/ConfirmationCode';
import User from '../models/User';
import { RequestError } from '../lib/errors';

let app = express();

let registerValidator = {
  body: {
    baseNumber: Joi.string().required().min(7).max(22),
    countryCode: Joi.string().required().min(1).max(4)
  }
};

app.post('/', validate(registerValidator), wrapAsyncRoute(async function (req, res, next) {
  let { baseNumber, countryCode } = req.body;

  let isValidNumber = validateNumber(baseNumber, countryCode);
  if (!isValidNumber) {
    throw new RequestError('Not a valid phone number');
  }

  let phoneNumber = normalize(`+${countryCode}${baseNumber}`);
  let confirmation = await ConfirmationCode.createOrUpdateFromNumber(phoneNumber);

  await twilio.sendConfirmationCode({
    code: confirmation.code,
    phoneNumber: confirmation.phoneNumber
  });

  res.json({
    phoneNumber: confirmation.phoneNumber
  });
}));

let confirmValidator = {
  body: {
    phoneNumber: Joi.string().required().min(7).max(22),
    code: Joi.string().required().min(1).max(50)
  }
};

app.post('/confirm', wrapAsyncRoute(async function (req, res, next) {
  let { phoneNumber, code } = req.body;

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

export default app;
