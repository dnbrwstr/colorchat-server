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

app.get('/', authenticate, wrapAsyncRoute(async function (req, res, next) {
  res.send(req.user.serialize());
}));

app.put('/', authenticate, validate(rootValidator), wrapAsyncRoute(async function (req, res, next) {
  let data = {};

  if (req.body.deviceToken) {
    data.deviceTokens = uniq(req.user.deviceTokens.concat(req.body.deviceToken));
  }

  if (req.body.name) {
    data.name = req.body.name;
  }

  await req.user.update(data);
  res.send(req.user.serialize());
}));

module.exports = app;
