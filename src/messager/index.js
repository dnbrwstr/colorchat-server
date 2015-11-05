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
import { processMessageData, logMessage } from '../lib/MessageUtils';
import createMessageClient from '../lib/createMessageClient';
import { ap, partial, always } from 'ramda';

let makeArray = o => o instanceof Array ? o : [o];

let handleError = function (socket, next) {
  socket.on('error', logError);
  next();
};

let processMessages = (messageData, userId) => {
  return messageData.map(m => {
    m.senderId = userId;
    return processMessageData(m);
  });
};

let createMessageApp = async function () {
  let userSockets = {};
  let messageClient;

  let addUserSocket = async function (userId, socket) {
    userSockets[userId] = socket;
    await messageClient.subscribeToUserMessages(userId);
  };

  let removeUserSocket = function (userId) {
    messageClient.unsubscribeFromUserMessages(userId);
    delete userSockets[userId];
  };

  let deliverMessageToUserSocket = function (message, ack) {
    let socket = userSockets[message.recipientId];

    if (!socket) {
      throw new ServerError('Trying to deliver message on a nonexistent socket for user ' + userId);
    }

    socket.emit('messagedata', message, ack);
  };

  let handleMessage = function (userId, messageData, cb) {
    let messages = processMessages(makeArray(messageData), userId);
    sendMessages(messages);
    cb && cb(messages);
  };

  let sendMessages = function (messages) {
    ap([
      sendMessageNotification,
      logMessage,
      m => messageClient.sendMessage(m.recipientId, m)
    ], messages);
  };

  let handleConnection = async function (socket, next) {
    let userId = socket.user.id;
    socket.on('messagedata', partial(handleMessage, userId));
    socket.on('disconnect', partial(removeUserSocket, userId));
    await addUserSocket(userId, socket);
    socket.emit('ready');
  };

  messageClient = await createMessageClient();
  messageClient.onMessage(deliverMessageToUserSocket);

  let app = io();
  app.use(handleError);
  app.use(wrap(authenticate));
  app.on('connection', wrap(handleConnection));
  return app;
};

export default createMessageApp;
