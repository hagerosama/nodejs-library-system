const ValidationError = require('../models/errors/ValidationError');

function parseIdParam(paramName) {
  return (req, res, next) => {
    const raw = req.params[paramName];
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      return next(new ValidationError(`Invalid ${paramName}`));
    }
    // normalize so handlers can assume it's a number
    req.params[paramName] = id;
    next();
  };
}

function requireFields(obj, fields) {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new ValidationError(`${field} is required`);
    }
  }
}

function validateBookCreate(req, res, next) {
  try {
    requireFields(req.body, ['title', 'author', 'isbn']);
    next();
  } catch (err) {
    next(err);
  }
}

function validateBookUpdate(req, res, next) {
  try {
    if (!Object.keys(req.body).length) {
      throw new ValidationError('Request body must include at least one field to update');
    }
    next();
  } catch (err) {
    next(err);
  }
}

function validateBorrowerCreate(req, res, next) {
  try {
    requireFields(req.body, ['name', 'email']);
    next();
  } catch (err) {
    next(err);
  }
}

function validateBorrowerUpdate(req, res, next) {
  try {
    if (!Object.keys(req.body).length) {
      throw new ValidationError('Request body must include at least one field to update');
    }
    next();
  } catch (err) {
    next(err);
  }
}

function validateCheckout(req, res, next) {
  try {
    requireFields(req.body, ['bookId']);
    if (req.body.dueDate) {
      const parsed = Date.parse(req.body.dueDate);
      if (Number.isNaN(parsed)) {
        throw new ValidationError('dueDate must be a valid date');
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

function validateReturn(req, res, next) {
  try {
    requireFields(req.body, ['bookId']);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  parseIdParam,
  validateBookCreate,
  validateBookUpdate,
  validateBorrowerCreate,
  validateBorrowerUpdate,
  validateCheckout,
  validateReturn,
};
