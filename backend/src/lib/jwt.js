const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET in backend/.env");
}

function signAuthToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

function verifyAuthToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};