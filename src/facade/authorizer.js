const { extractTokenFromHeader, verifyToken } = require('../utils/jwtUtil');

function authMiddleware(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    const decoded = verifyToken(token);
    req.borrower = decoded; 
    next();
  } catch (err) {
    next(err); 
  }
}

module.exports = authMiddleware;
