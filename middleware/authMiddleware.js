const jwt = require('jsonwebtoken');
const { cookieName, secret } = require('../config/jwt');

module.exports = async (req, res, next) => {
  try {
    let token;
    
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback: try to get token from cookie
    if (!token) {
      token = req.cookies && req.cookies[cookieName];
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: no token' });
    }

    const payload = jwt.verify(token, secret);
    // attach minimal user info to request
    req.user = { id: payload.id, role_id: payload.role_id };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};
