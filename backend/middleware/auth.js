const jwt = require('jsonwebtoken');

// This runs before protected routes to check the token
module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user id to request
    next();
  } catch {
    res.status(401).json({ message: 'Token is invalid' });
  }
};