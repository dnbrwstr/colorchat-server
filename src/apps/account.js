import express from 'express';
import validate from 'express-validation';
import Joi from 'joi';
import { uniq } from 'ramda';
import wrapAsyncRoute from '../lib/wrapAsyncRoute';
import authenticate from '../lib/authenticate';

let app = express();

let rootValidator = {
  body: {
    deviceToken: Joi.string().required()
  }
};

app.put('/', authenticate, validate(rootValidator), wrapAsyncRoute(async function (req, res, next) {
 console.log(req);

 await req.user.update({
  deviceTokens: uniq(req.user.deviceTokens.concat(req.body.deviceToken))
 });

 res.send(200);
}));

module.exports = app;
