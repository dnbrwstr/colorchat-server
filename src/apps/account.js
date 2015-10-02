import express from 'express';
import validate from 'express-validation';
import Joi from 'joi';
import { uniq } from 'ramda';
import wrapAsyncRoute from '../lib/wrapAsyncRoute';
import authenticate from '../lib/authenticate';

let app = express();

let rootValidator = {
  body: {
    deviceToken: Joi.string(),
    name: Joi.string()
  }
};

app.put('/', authenticate, validate(rootValidator), wrapAsyncRoute(async function (req, res, next) {
  let data = {}

  if (req.body.deviceToken) {
    data.deviceTokens = uniq(req.user.deviceTokens.concat(req.body.deviceToken));
  }

  if (req.body.name) {
    data.name = req.body.name;
  }

 await req.user.update(data);
 res.send(200);
}));

module.exports = app;
