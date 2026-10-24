const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const User = require('../models/User');
module.exports = async (req,res,next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return next();
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');
    if (user) req.user = user;
  } catch (_) {}
  next();
};
