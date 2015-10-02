import redis from 'redis';
import uuid from 'uuid';
import chalk from 'chalk';
import io from 'socket.io';
import { merge, pick } from 'ramda';
import { PermissionsError, RequestError } from '../lib/errors';
import User from '../models/User';
import Message from '../models/Message';
import logError from '../lib/logError';
import createRedisClient from '../lib/createRedisClient';
import { sendMessageNotification } from '../lib/NotificationUtils';

let userSockets = {};
let redisClient = createRedisClient();

redisClient.setDeliveryHandler(function (userId, messages, onDeliverySuccess) {
  let socket = userSockets[userId];

  if (!socket) {
    throw new Error('Trying to deliver message on a nonexistent socket for user ' + userId);
  }

  socket.emit('messagedata', messages, onDeliverySuccess);
});

let app = io();

let wrap = fn => (socket, next) => {
  fn.apply(null, [socket, next]).catch(e => {
    logError(e);
    next(e);
  });
};

let processMessageData = messageData => {
  let allowedKeys = [
    'id',
    'senderId',
    'recipientId',
    'color',
    'createdAt',
    'width',
    'height'
  ];
  let id = uuid.v4();

  return pick(allowedKeys, merge(messageData, {
    id,
    createdAt: new Date()
  }));
};

// Middleware

let handleError = function (socket, next) {
  socket.on('error', logError);
  next();
};

let authenticateUser = async function (socket, next) {
  let token = socket.handshake.query.token;

  if (!token) {
    throw new RequestError('Missing token');
  }

  let user = await User.findByToken(token);

  if (!user) {
    throw new PermissionsError('Invalid token');
  } else {
    socket.user = user;
    return next();
  }
};

let handleConnection = async function (socket, next) {
  let userId = socket.user.id;

  userSockets[userId] = socket;
  redisClient.onUserConnect(userId);

  socket.on('messagedata', wrap(async function (messageData, cb) {
    if (!(messageData instanceof Array)) {
      messageData = [messageData];
    }

    let processedMessages = messageData.map(m => {
      m.senderId = userId;
      return processMessageData(m);
    });

    let { senderId, recipientId } = processedMessages[0];
    console.log(chalk.blue('Message:', senderId, '=>', recipientId));

    processedMessages.map(sendMessageNotification);

    redisClient.sendMessages(processedMessages)
      .then(function () {
        if (cb) cb(processedMessages);
      })
      .catch(console.log);
  }));

  socket.on('disconnect', () => {
    redisClient.onUserDisconnect(userId);
    delete userSockets[userId];
  });
};

app.use(handleError);
app.use(wrap(authenticateUser));
app.on('connection', wrap(handleConnection));

export default app;