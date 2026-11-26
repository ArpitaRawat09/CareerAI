const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis.js");

async function authUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Token Not provided" });
  }

  try {
    // Check if the token is blacklisted in Redis
    const isTokenBlacklisted = await redisClient.get(`blacklist_${token}`);

    if (isTokenBlacklisted) {
      return res.status(401).json({ message: "Token is Invalid" });
    }
  } catch (err) {
    // If Redis is unreachable, don't break every protected route; JWT is still verified below.
    console.error("Redis blacklist check failed:", err.message);
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
