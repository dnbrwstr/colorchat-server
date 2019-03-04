import io from 'socket.io';
import logError from '../lib/logError';
import { sendChatMessageNotification } from '../lib/NotificationUtils';
import wrap from '../lib/wrapSocketMiddleware';
import authenticate from '../lib/authenticateSocket';
import { processChatMessageData, logChatMessage, processComposeMessageData } from '../lib/MessageUtils';
import createMessageClient from '../lib/createMessageClient';
import rateLimitSocketHandler from '../lib/rateLimitSocketHandler';
import { ap, partial, always, set , _, lensProp, merge } from 'ramda';

let makeArray = o => o instanceof Array ? o : [o];

let handleError = function (socket, next) {
  socket.on('error', logError);
  next();
};

let createMessageApp = async function () {
  let userSockets = {};
  let messageClient;

  // Socket management

  let addUserSocket = async function (userId, socket) {
    userSockets[userId] = socket;
    await messageClient.subscribeToUserMessages(userId);
  };

  let removeUserSocket = function (userId) {
    // Since user can no longer receive messages at the point
    // this is called, we don't wait for the unsubscribe to complete
    // before deleting their mailbox. Anything that arrives during
    // unsubscribe will get nack'd.
    messageClient.unsubscribeFromUserMessages(userId);
    delete userSockets[userId];
  };

  // Handle messages from socket

  let handleCompose = function (userId, data, cb) {
    const composeEvent = processComposeMessageData(data);

    sendMessage(
      'composeevent',
      data.recipientId,
      merge(composeEvent, { senderId: userId }),
      { expiration: 500 , persistent: false }
    );
    cb && cb(data);
  };

  let handleChat = function (user, data, cb) {
    let chats = makeArray(data)
      .map(processChatMessageData)
      .map(set(lensProp('senderName'), user.name))
      .map(set(lensProp('senderId'), user.id))

    ap([
      sendChatMessageNotification,
      logChatMessage,
      m => sendMessage('messagedata', m.recipientId, m)
    ], chats);

    cb && cb(chats);
  };

  let sendMessage = function (type, recipientId, data, options) {
    messageClient.sendMessage(recipientId, {
      type,
      content: data
    }, options);
  };

  // Handle messages from queue

  let handleReceiveMessage = function (message, ack, nack) {
    let socket = userSockets[message.content.recipientId];

    if (socket) {
      socket.emit(message.type, message.content, ack);
    } else {
      console.log(`Socket delivery failed. User: ${message.content.recipientId}, Message: ${message.content.id}. Requeuing...`);
      nack(message);
    }
  };

  // Application setup

  let handleConnection = async function (socket, next) {
    let userId = socket.user.id;
    socket.on('messagedata', rateLimitSocketHandler(socket, partial(handleChat, [socket.user])));
    socket.on('composeevent', partial(handleCompose, [userId]));
    socket.on('disconnect', partial(removeUserSocket, [userId]));
    await addUserSocket(userId, socket);
    socket.emit('ready');
  };

  messageClient = await createMessageClient();
  messageClient.onMessage(handleReceiveMessage);

  let app = io();
  app.use(handleError);
  app.use(wrap(authenticate));
  app.on('connection', wrap(handleConnection));
  return app;
};

export default createMessageApp;
