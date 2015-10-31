import redis from 'redis';
import uuid from 'uuid';
import chalk from 'chalk';
import io from 'socket.io';
import { ServerError } from '../lib/errors';
import User from '../models/User';
import logError from '../lib/logError';
import { sendMessageNotification } from '../lib/NotificationUtils';
import wrap from '../lib/wrapSocketMiddleware';
import authenticate from '../lib/authenticateSocket';
import { processMessageData } from '../lib/MessageUtils';
import createMessageClient from '../lib/createMessageClient';

let userSockets = {};

// Middleware

let handleError = function (socket, next) {
  socket.on('error', logError);
  next();
};

let handleConnection = async function (socket, next) {
  let userId = socket.user.id;
  userSockets[userId] = socket;
  messageClient.subscribeToUserMessages(userId);

  socket.on('messagedata', wrap(async function (messageData, cb) {
    let processedMessages = getProcessedMessages(messageData, userId);
    processedMessages.forEach(m => {
      sendMessageNotification(m);
      logMessage(m);
      messageClient.sendMessage(m.recipientId, m);
    });
    cb && cb(processedMessages);
  }));

  socket.on('disconnect', () => {
    messageClient.unsubscribeFromUserMessages(userId);
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

let app = io();

let messageClient = createMessageClient();

messageClient.onReady(function () {
  app.use(handleError);
  app.use(wrap(authenticate));
  app.on('connection', wrap(handleConnection));
});

messageClient.onMessage(function (message, ack) {
  let socket = userSockets[message.recipientId];

  if (!socket) {
    throw new ServerError('Trying to deliver message on a nonexistent socket for user ' + userId);
  }

  socket.emit('messagedata', message, ack);
});

export default app
