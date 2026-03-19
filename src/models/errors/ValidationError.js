const HttpError = require('./HttpError');

class ValidationError extends HttpError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

module.exports = ValidationError;
