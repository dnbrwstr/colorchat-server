class BaseError extends Error {
  constructor(message) {
    super(...arguments);
    this.message = message;
    this.stack = (new Error()).stack;
  }
}

export class RequestError extends BaseError {
  constructor() {
    super(...arguments);
    this.status = 400;
  }
}

export class PermissionsError extends BaseError {
  constructor() {
    super(...arguments);
    this.status = 403;
  }
}

export class NotFoundError extends BaseError {
  constructor() {
    super(...arguments);
    this.status = 404;
  }
}

export class ServerError extends BaseError {
  constructor() {
    super(...arguments);
    this.status = 500;
  }
}
