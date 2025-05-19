import express from 'express';
import Joi from '@hapi/joi';
import { celebrate } from 'celebrate';
import twilio from '../lib/twilio';
import wrapAsyncRoute from '../lib/wrapAsyncRoute';
import { validate as validateNumber, normalize } from '../lib/PhoneNumberUtils';
import User from '../models/User';
import { PermissionsError, RequestError } from '../lib/errors';

const app = express();

const validateRegistrationParams = celebrate({
  body: Joi.object({
    baseNumber: Joi.string().required().min(7).max(22),
    countryCode: Joi.string().required().min(1).max(4)
  })
});

app.post('/', validateRegistrationParams, wrapAsyncRoute(async function (req, res, next) {
  let { baseNumber, countryCode } = req.body;

  let isValidNumber = validateNumber(baseNumber, countryCode);
  if (!isValidNumber) {
    throw new RequestError('Not a valid phone number');
  }

  let phoneNumber = normalize(`+${countryCode}${baseNumber}`);

  await twilio.sendConfirmationCode({
    phoneNumber: phoneNumber
  });

  res.json({
    phoneNumber: phoneNumber
  });
}));

const validateConfirmationParams = celebrate({
  body: Joi.object({
    phoneNumber: Joi.string().required().min(7).max(22),
    code: Joi.string().required().min(1).max(50)
  })
});

app.post('/confirm', validateConfirmationParams, wrapAsyncRoute(async function (req, res, next) {
  let { phoneNumber, code } = req.body;

  let confirmation = await twilio.checkConfirmationCode({
    phoneNumber: phoneNumber,
    code: code
  });

  // Possible statuses:
  // pending, approved, canceled, max_attempts_reached, deleted, failed or expired
  if (confirmation.status === 'approved') {
    let user = await User.createOrUpdateFromPhoneNumber(phoneNumber);
    res.json({
      user: {
        id: user.id,
        token: user.tokens.pop(),
        phoneNumber: user.phoneNumber
      }
    });
    return;
  } else if (confirmation.status === 'pending') {
    throw new PermissionsError('Invalid confirmation code');
  } else if (confirmation.status === 'max_attempts_reached') {
    throw new PermissionsError('Too many confirmation attempts');
  }

  throw new PermissionsError('An unknown error occurred')
}));

export default app;
