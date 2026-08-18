require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const JWT_SECRET = process.env.JWT_SECRET;
const BEURL = process.env.BEURL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PATTERN = /^[a-zA-Z0-9._%+-]+@wl\.team$/;
const PATTERN2 = /^[a-zA-Z0-9._%+-]+@websitelearners\.com$/;
const HUBSPOT_API = process.env.HUBSPOT_API;

module.exports = {
  MONGO_URI,
  PORT,
  EMAIL_PASS,
  EMAIL_USER,
  JWT_SECRET,
  BEURL,
  FRONTEND_URL,
  PATTERN,
  PATTERN2,
  HUBSPOT_API,
};
