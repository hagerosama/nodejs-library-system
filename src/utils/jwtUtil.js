const jwt = require('jsonwebtoken');
const { HttpError } = require('../models/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

function generateToken(borrowerId, email) {
  return jwt.sign(
    { id: borrowerId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new HttpError('Invalid or expired token', 401);
  }
}

function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError('Missing or invalid authorization header', 401);
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
};
