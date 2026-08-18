require("dotenv").config();

module.exports = {
  PORT: process.env.PORT,
  OCTO_AI_KEY: process.env.OCTO_AI_API_KEY,
  CLOUDFLARE_SK: process.env.CLOUDFLARE_SK,
  MONGO_URI: process.env.MONGO_URI,
};
