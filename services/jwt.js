var jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "aksjdfbskadfjbskdjfbzlsdfhb";

function generateToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "20m" });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" }); // Refresh token valid for 7 days
}

function verifyRefreshToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
};
