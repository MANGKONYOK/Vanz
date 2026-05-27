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
  // TODO: verify token signature when auth service is integrated
  // const jwt = require('jsonwebtoken');
  // try { req.user = jwt.verify(token, process.env.JWT_SECRET); }
  // catch (e) { return res.status(401).json({ error_code: 'UNAUTHORIZED', ... }); }
  req.token = token;
  return next();
}

module.exports = authenticate;
