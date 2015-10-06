import redis from 'redis';
import uuid from 'uuid';
import chalk from 'chalk';
import io from 'socket.io';
import { ServerError } from '../lib/errors';
import User from '../models/User';
import logError from '../lib/logError';
import createRedisClient from '../lib/createRedisClient';
import { sendMessageNotification } from '../lib/NotificationUtils';
import wrap from '../lib/wrapSocketMiddleware';
import authenticate from '../lib/authenticateSocket';
import { processMessageData } from '../lib/MessageUtils';

let userSockets = {};

let deliverMessages = function (userId, messages, onDeliverySuccess) {
  let socket = userSockets[userId];

  if (!socket) {
    throw new ServerError('Trying to deliver message on a nonexistent socket for user ' + userId);
  }

  socket.emit('messagedata', messages, onDeliverySuccess);
};

let redisClient = createRedisClient({
  deliverMessages: deliverMessages
});

let app = io();

// Middleware

let handleError = function (socket, next) {
  socket.on('error', logError);
  next();
};

let handleConnection = async function (socket, next) {
  let userId = socket.user.id;
  userSockets[userId] = socket;
  redisClient.onUserConnect(userId);

  socket.on('messagedata', wrap(async function (messageData, cb) {
    let processedMessages = getProcessedMessages(messageData, userId);
    processedMessages.forEach(sendMessageNotification);
    processedMessages.forEach(logMessage);

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

let getProcessedMessages = (messageData, userId) => {
  if (!(messageData instanceof Array)) {
    messageData = [messageData];
  }

  return messageData.map(m => {
    m.senderId = userId;
    return processMessageData(m);
  });
};

let logMessage = message => {
  let { senderId, recipientId } = message;
  console.log(chalk.blue('Message:', senderId, '=>', recipientId));
};

app.use(handleError);
app.use(wrap(authenticate));
app.on('connection', wrap(handleConnection));

export default app
