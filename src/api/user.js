import express from 'express';
import wrap from '../lib/wrapAsyncRoute';
import authenticate from '../lib/authenticate';
import User from '../models/User';
import { normalize } from '../lib/PhoneNumberUtils';

let app = express();

app.get('/:number/avatar', authenticate, wrap(async function (req, res, next) {
  const number = normalize(req.params.number, req.user.phoneNumber);
  const user = await User.findOne({ where: {
    phoneNumber: number
  } });
  res.json({
    avatar: user.avatar
  });
}));

export default app;
