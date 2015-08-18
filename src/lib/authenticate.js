import { PermissionsError } from './errors';
import wrapAsyncRoute from './wrapAsyncRoute';
import User from '../models/User';

let authenticate = wrapAsyncRoute(async function (req, res, next) {
  let token = req.headers['x-auth-token'];

  if (token) {
    let user = await User.findByToken(token);
    if (user) {
      req.user = user;
      next();
    } else {
      throw new PermissionsError('Invalid session');
    }
  } else {
    throw new PermissionsError('User is not logged in');
  }
});

export default authenticate;
