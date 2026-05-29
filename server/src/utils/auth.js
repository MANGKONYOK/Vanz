'use strict';
// JWT authentication middleware stub.
// Replace with real jwt.verify() once the auth service issues tokens.

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error_code: 'UNAUTHORIZED',
      message: 'Authorization header missing or malformed. Expected: Bearer <jwt_token>',
      field_errors: [],
    });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error_code: 'UNAUTHORIZED',
      message: 'JWT token is empty',
      field_errors: [],
    });
  }

  // Local development token used by client/.env
  if (token === 'dev-local-token') {
    req.token = token;
    return next();
  }

  const jwt = require('jsonwebtoken');
  
  if (process.env.JWT_SECRET) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        error_code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        field_errors: [],
      });
    }
  } else {
    console.warn('JWT_SECRET is not set. Token signature verification is skipped.');
  }

  req.token = token;
  return next();
}

module.exports = authenticate;
