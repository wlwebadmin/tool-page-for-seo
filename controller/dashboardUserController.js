const DashboardUser = require("../models/dashboardUserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const { FRONTEND_URL, JWT_SECRET } = require("../utils/config");
const {
  generateToken,
  getTokenFrom,
  verifyEmail,
  main,
} = require("../utils/helper");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ message: "all fields are mandotary" });
      return;
    }

    if (!verifyEmail(email)) {
      res.status(400).json({ message: "Invalid Email" });
      return;
    }

    const userExists = await DashboardUser.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const randomString =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const link = `${FRONTEND_URL}confirmuser/${randomString}`;

    const message = `
    <h2>Hello ${name}</h2>
    <p>Please Click below link and Activated.</p>  

    <a href=${link} target="_blank">${link}</a>

    <p>Regards...</p>
    <p>GW Team</p>
  `;

    const sendMail = await main("Confirm Your account", message);

    if (!sendMail) {
      res
        .status(401)
        .json({ message: `Please Check Your Admin to get Access` });
      return;
    }

    // Create new user
    const user = await DashboardUser.create({
      name,
      email,
      password,
      verifyToken: randomString,
    });

    res
      .status(201)
      .json({ message: `account created successfully ${user.name}` });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const confirmUser = async (req, res) => {
  try {
    const verifyToken = req.params.id;

    const matchedUser = await DashboardUser.findOne({ verifyToken });

    if (matchedUser === null || matchedUser.verifyToken === "") {
      return res.status(400).json({ message: "Account Already Activated" });
    }

    //confirming and updating account
    matchedUser.isVerified = true;

    matchedUser.verifyToken = "";

    await DashboardUser.findByIdAndUpdate(matchedUser._id, matchedUser);

    res.status(201).json({
      message: `${matchedUser.name} account has been verified successfully`,
    });
    //
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validating user
    if (!verifyEmail(email)) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ message: "all fields are mandotary" });
      return;
    }

    const user = await DashboardUser.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "user not exist/Please Sign-up" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Account not verfied, kindly check your Email" });
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect) {
      return res.status(401).json({ message: "password incorrect" });
    }

    //   Generate Token
    const token = generateToken(user._id);

    //format user data before sending
    const formatUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      token,
      formatUser,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    //verify the user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    //getting data from FE

    const { name, email, password } = req.body;

    if (!verifyEmail(email)) {
      res.status(400).json({ message: "Invalid Email" });
      return;
    }

    const matchedUser = await DashboardUser.findOne({ email });

    if (matchedUser.id !== decodedToken.id) {
      return res.status(401).json({ message: "user not " });
    }

    matchedUser.name = name;
    matchedUser.password = password;

    await matchedUser.save();

    const formatUser = {
      _id: matchedUser._id,
      name: matchedUser.name,
      email: matchedUser.email,
    };

    //   Generate Token
    const newToken = generateToken(formatUser._id);
    //sending data to FE

    res.status(200).json({ formatUser, token: newToken });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // validating user
    if (!verifyEmail(email)) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }

    const user = await DashboardUser.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "User not exists" });
      return;
    }

    // Delete token if it exists in DB
    let token = await Token.findOne({ userId: user._id });

    if (token) {
      await token.deleteOne();
    }

    // Create Reste Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

    // Hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Construct Reset Url
    const resetUrl = `${FRONTEND_URL}resetpassword/${resetToken}`;

    // Reset Email
    const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30 minutes.</p>

      <a href=${resetUrl} target="_blank">${resetUrl}</a>

      <p>Regards...</p>
      <p>GW Obboarding Admin Team</p>
    `;
    const subject = "Password Reset Request";

    //sending email for password reset account

    const sendMail = await main(subject, message);

    if (!sendMail) {
      res
        .status(401)
        .json({ message: `Please Check Your Admin to get Access` });
      return;
    }

    // Save Token to DB
    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
    }).save();

    return res
      .status(201)
      .json({ message: `Mail has been send, please check your email` });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const { resetToken } = req.params;

    // Hash token, then compare to Token in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // fIND tOKEN in DB
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
      res.status(400).json({ message: "Link Expired, Please try again" });
      return;
    }

    // Find user
    const user = await DashboardUser.findOne({ _id: userToken.userId });

    user.password = password;

    await user.save();

    await userToken.deleteOne();

    res.status(200).json({
      message: "Password updated Successfully, Please Login",
    });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  confirmUser,
  loginUser,
  updateUser,
  forgotPassword,
  resetPassword,
};
