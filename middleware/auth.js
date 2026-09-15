const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Mengambil token dari header 'Authorization: Bearer <token>' atau query ?token=
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user payload to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or has expired.' });
  }
};

module.exports = authenticateToken;
