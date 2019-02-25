import express from 'express';
import validate from 'express-validation';
import Joi from 'joi';
import { uniq } from 'ramda';
import wrap from '../lib/wrapAsyncRoute';
import authenticate from '../lib/authenticate';

let app = express();

let rootValidator = {
  body: {
    deviceToken: Joi.string(),
    platform: Joi.string(),
    deviceId: Joi.string(),
    name: Joi.string(),
    unreadCount: Joi.number(),
    avatar: Joi.string()
  }
};

app.get('/', authenticate, wrap(async function (req, res, next) {
  res.send(req.user.serialize());
}));

app.put('/', authenticate, validate(rootValidator), wrap(async function (req, res, next) {
  if (req.body.deviceToken) {
    await req.user.addDeviceToken({
      token: req.body.deviceToken,
      platform: req.body.platform,
      deviceId: req.body.deviceId
    });
  }

  let data = {};

  if (req.body.name) {
    data.name = req.body.name;
  }

  if (req.body.avatar) {
    data.avatar = req.body.avatar;
  }

  if (typeof req.body.unreadCount !== "undefined") {
    data.unreadCount = req.body.unreadCount;
  }

  await req.user.update(data);
  res.send(req.user.serialize());
}));

app.delete('/', authenticate, wrap(async function (req, res, next) {
  await req.user.destroy();
  res.send(200);
}));

module.exports = app;
