const { ValidationError } = require('../models/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.code === 'ER_DUP_ENTRY') {
    const message = err.message?.includes('for key')
      ? err.message
      : 'Duplicate value';
    err = new ValidationError(message);
  }

  const status = err.status || 500;
  const body = { message: err.message || 'Internal Server Error' };

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
