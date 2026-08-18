const crypto = require("crypto");
const {
  JWT_SECRET,
  PATTERN,
  PATTERN2,
  EMAIL_USER,
  EMAIL_PASS,
  HUBSPOT_API,
} = require("./config");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const headers = {
  Authorization: `Bearer ${HUBSPOT_API}`,
  "Content-Type": "application/json",
};

// Function to generate a random string for JWT secret
function generateRandomString(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex") // Convert to hexadecimal string
    .slice(0, length); // Trim to desired length
}

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1d" });
};

//getting token
const getTokenFrom = (req) => {
  const authorization = req.get("authorization");

  if (authorization && authorization.startsWith("bearer ")) {
    return authorization.replace("bearer ", "");
  }
};

//email validation
function verifyEmail(email) {
  return PATTERN.test(email) || PATTERN2.test(email);
}

//sending email
async function main(subject, message) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"GW Onboarding Admin" <${EMAIL_USER}>`,
    to: EMAIL_USER,
    subject: subject,
    html: message,
  });

  return info.messageId;
}

async function sendDataToHubSpot(data) {
  try {
    if (data.properties.chat_availability != "no") {
      await axios.post("https://api.hubapi.com/crm/v3/objects/contacts", data, {
        headers,
      });
    }
    const dataForAutomation = { ...data, method: "onBoarding" };

    await axios.post(
      "https://hook.us1.make.com/dvquv4qtsceh5o0pyldas1kcjxqgosvm",
      dataForAutomation
    );
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  generateRandomString,
  generateToken,
  getTokenFrom,
  verifyEmail,
  main,
  sendDataToHubSpot,
};
