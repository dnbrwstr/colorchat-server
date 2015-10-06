import logError from '../lib/logError';

export default fn => (socket, next) => {
  fn.apply(null, [socket, next]).catch(e => {
    logError(e);
    next(e);
  });
};