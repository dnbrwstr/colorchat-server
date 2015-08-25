import io from 'socket.io';
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
}

app.use(function (socket, next) {
  socket.on('error', logError);
  next();
})

app.use(wrap(async function (socket, next) {
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
}));

app.on('connection', wrap(async function (socket) {
  userSockets[socket.user.id] = socket;

  let messages = await Message.findAllByRecipientId(socket.user.id);

  socket.emit('pending', messages, function () {
    messages.forEach(m => m.destroy());
  });

  socket.on('message', wrap(async function (messageData, cb) {
    messageData.senderId = socket.user.id;

    let message = await Message.create(messageData);

    if (userSockets[messageData.recipientId]) {
      userSockets[messageData.recipientId].emit('message', message, function () {
        message.destroy();
        if (cb) cb(message);
      });
    } else {
      if (cb) cb(message);
    }
  }));

  socket.on('disconnect', function () {
    delete userSockets[socket.user.id];
  });
}));

export default app;