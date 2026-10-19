const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'foodrecipes_super_secret_jwt_key_2024';

/**
 * Middleware to require a valid JWT token.
 * Extracts Bearer token from the Authorization header.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format must be: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Token is invalid or has expired.'
    });
  }
}

/**
 * Middleware for optional JWT authentication.
 * Sets req.user if a valid token is provided, but continues regardless.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    const token = parts[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email
      };
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

module.exports = {
  verifyToken,
  optionalAuth
};
