import uuid from 'uuid';
import io from 'socket.io';
import { merge } from 'ramda';
import { PermissionsError, RequestError } from '../lib/errors';
import User from '../models/User';
import Message from '../models/Message';
import logError from '../lib/logError';

let userSockets = {};

let app = io();

let wrap = fn => (socket, next) => {
  fn.apply(null, [socket, next]).catch(e => {
    logError(e);
    next(e);
  });
};

let processMessageData = messageData => {
  let id = uuid.v4();

  return merge(messageData, {
    id,
    createdAt: new Date()
  });
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
  userSockets[socket.user.id] = socket;

  let messages = await Message.findAllByRecipientId(socket.user.id);

  if (messages.length) {
    socket.emit('pending', messages, function () {
      Message.destroy({ where: {
        id: messages.map(m => m.id)
      } });
    });
  }

  socket.on('message', wrap(async function (messageData, cb) {
    messageData.senderId = socket.user.id;

    let message = processMessageData(messageData);

    if (userSockets[message.recipientId]) {
      userSockets[message.recipientId].emit('message', message);
    } else {
      await Message.create(message);
    }

    if (cb) cb(message);
  }));

  socket.on('disconnect', () => {
    delete userSockets[socket.user.id];
  });
};

app.use(handleError);
app.use(wrap(authenticateUser));
app.on('connection', wrap(handleConnection));

export default app;