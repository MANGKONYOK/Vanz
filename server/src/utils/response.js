'use strict';
const logger = require('./logger');

function success(res, data, status = 200) {
  return res.status(status).json(data);
}

function handleError(res, err) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: err.message,
      field_errors: err.fieldErrors || [],
    });
  }
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error_code: 'NOT_FOUND',
      message: err.message,
      field_errors: [],
    });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error_code: 'UNAUTHORIZED',
      message: err.message,
      field_errors: [],
    });
  }
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error_code: 'FORBIDDEN',
      message: err.message,
      field_errors: [],
    });
  }
  logger.error(err.message, err.stack);
  return res.status(500).json({
    error_code: 'SERVER_ERROR',
    message: 'An unexpected error occurred',
    field_errors: [],
  });
}

module.exports = { success, handleError };
