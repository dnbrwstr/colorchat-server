import io from 'socket.io';
import { PermissionsError, RequestError } from '../lib/errors';
import User from '../models/User';
import Message from '../models/Message';

let userSockets = {};

let app = io();

let wrap = fn => (socket, next) => {
  fn.apply(null, [socket, next]).catch(e => console.log(e));
}

app.use(wrap(async function (socket, next) {
  let token = socket.handshake.query.token;

  if (!token) {
    return next(new RequestError('Missing token'));
  }

  let user = await User.findByToken(token);

  if (!user) {
    return next(new PermissionsError('Invalid token'));
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

  socket.on('message', function (messageData, cb) {
    messageData.senderId = socket.user.id;

    if (userSockets[messageData.recipientId]) {
      userSockets[messageData.recipientId].emit('message', messageData);
    } else {
      Message.create(messageData);
    }

    if (cb) cb();
  });

  socket.on('disconnect', function () {
    delete userSockets[socket.user.id];
  });
}));

export default app;