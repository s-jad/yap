const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

const authorization = (req, res, next) => {
  const signature = req.cookies.jwt_signature;
  const payload = req.cookies.jwt_payload;
  if (!signature || !payload) {
    return res.status(403).json({ message: 'No token provided.' });
  }
  const token = `${signature}.${payload}`;
  try {
    const data = jwt.verify(token, jwtSecret);
    req.userId = data.id;
    return next();
  } catch {
    return res.status(403).json({ message: 'Failed to authenticate token.' });
  }
};


module.exports = {
  authorization,
};
