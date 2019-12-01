import express from 'express';
import {celebrate} from 'celebrate';
import Joi from '@hapi/joi';
import wrap from '../lib/wrapAsyncRoute';
import authenticate from '../lib/authenticate';

const app = express();

const validateAccountData = celebrate({
  body: Joi.object().keys({
    deviceToken: Joi.string(),
    platform: Joi.string(),
    deviceId: Joi.string(),
    name: Joi.string(),
    unreadCount: Joi.number(),
    avatar: Joi.string(),
    blockedUsers: Joi.array().items(Joi.number())
  })
});

app.get('/', authenticate, wrap(async function (req, res, next) {
  res.send(req.user.serializePrivate());
}));

app.put('/', authenticate, validateAccountData, wrap(async function (req, res, next) {
  if (req.body.deviceToken) {
    await req.user.addDeviceToken({
      token: req.body.deviceToken,
      platform: req.body.platform,
      deviceId: req.body.deviceId
    });
  }

  const updateableProps = [
    'name', 
    'avatar', 
    'unreadCount'
  ];

  const data = updateableProps.reduce((memo, prop) => {
    if (typeof req.body[prop] !== 'undefined') {
      memo[prop] = req.body[prop];
    }
    return memo;
  }, {});

  await req.user.update(data);
  res.send(req.user.serializePrivate());
}));

app.delete('/', authenticate, wrap(async function (req, res, next) {
  await req.user.destroy();
  res.send(200);
}));

const getBlocked = async user => (await user.getBlockedUsers()).map(u => u.serializePublic());

app.get('/blocked', authenticate, wrap(async function (req, res, next) {
  const blockedUsers = await getBlocked(req.user);
  res.send({ blockedUsers });
}));

app.post('/blocked/:id', authenticate, wrap(async function (req, res, next) {
  await req.user.blockUser(parseInt(req.params.id));
  const blockedUsers = await getBlocked(req.user);
  res.send({ blockedUsers });
}));

app.delete('/blocked/:id', authenticate, wrap(async function (req, res, next) {
  await req.user.unblockUser(parseInt(req.params.id));
  const blockedUsers = await getBlocked(req.user);
  res.send({ blockedUsers });
}));

module.exports = app;
