'use strict';
const logger = require('./logger');

function success(res, data, status = 200) {
  return res.status(status).json(data);
}

function handleError(res, err) {
  if (err.code === '23505') {
    let msg = 'A record with this unique identifier already exists.';
    if (err.detail) {
      const match = err.detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
      if (match) {
        const field = match[1];
        const val = match[2];
        const fieldLabel = field === 'code' ? 'ID' : field;
        msg = `Duplicate record: A record with ${fieldLabel} "${val}" already exists.`;
      }
    }
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: msg,
      field_errors: [{ field: 'code', reason: msg }],
    });
  }
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
