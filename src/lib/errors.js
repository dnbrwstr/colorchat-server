class BaseError extends Error {
  constructor(message) {
    super(arguments)
    this.message = message;
    this.stack = (new Error()).stack
  }
}

module.exports = {
  Request: class RequestError extends BaseError {
    get status () { return 400 }
  },
  Permissions: class PermissionsError extends BaseError {
    get status () { return 403 }
  },
  NotFound: class NotFoundError extends BaseError {
    get status () { return 404 }
  },
  Server: class ServerError extends BaseError {
    get status () { return 500 }
  }
};
