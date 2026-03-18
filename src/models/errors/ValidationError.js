const HttpError = require('./HttpError');

class ValidationError extends HttpError {
  constructor(message = 'Validation failed') {
    super(400, message);
  }
}

module.exports = ValidationError;
