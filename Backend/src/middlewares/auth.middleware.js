const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis.js");

async function authUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Token Not provided" });
  }

  // Check if the token is blacklisted in Redis
  const isTokenBlacklisted = await redisClient.get(`blacklist_${token}`);

  if (isTokenBlacklisted) {
    return res.status(401).json({ message: "Token is Invalid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { authUser };
