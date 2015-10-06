import { PermissionsError } from './errors';
import wrapAsyncRoute from './wrapAsyncRoute';
import User from '../models/User';

let authenticate = wrapAsyncRoute(async function (req, res, next) {
  let token = req.headers['x-auth-token'];
  if (!token) throw new PermissionsError('User is not logged in');

  let user = await User.findByToken(token);
  if (!user) throw new PermissionsError('Invalid session');

  req.user = user;
  next();
});

export default authenticate;
