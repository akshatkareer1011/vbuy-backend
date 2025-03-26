const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../db").db;

const auth = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).send({ error: "Unable to authenticate. No token!" });
  }

  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET_USER
    );
    req.user = decoded;
    req.token = token.split(" ")[1];
    next();
  } catch (e) {
    return res.status(403).send({ error: "Invalid or expired token" });
  }
};

const adminAuth = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).send({ error: "Unable to authenticate. No token!" });
  }

  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET_ADMIN
    );
    req.user = decoded;
    req.token = token.split(" ")[1];
    next();
  } catch (e) {
    res.status(403).send({ error: "Invalid or expired token!" });
  }
};

module.exports = {
  auth,
  adminAuth,
};
