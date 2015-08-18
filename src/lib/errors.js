class BaseError extends Error {
  constructor(message) {
    super(arguments)
    this.message = message;
    this.stack = (new Error()).stack
  }
}

export class RequestError extends BaseError {
  get status () { return 400 }
}

export class PermissionsError extends BaseError {
  get status () { return 403 }
}

export class NotFoundError extends BaseError {
  get status () { return 404 }
}

export class ServerError extends BaseError {
  get status () { return 500 }
}
