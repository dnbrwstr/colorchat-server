import { RequestError, PermissionsError } from '../lib/errors';
import User from '../models/User';

let authenticateSocket = async function (socket, next) {
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

export default authenticateSocket;
