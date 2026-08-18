const crypto = require("crypto");
const { JWT_SECRET } = require("../utils/config");
const { getTokenFrom, sendDataToHubSpot } = require("../utils/helper");
const jwt = require("jsonwebtoken");
const OnboardModel = require("../models/onBoardModel");
const DashboardUser = require("../models/dashboardUserModel");
const { restrictedCountries } = require("../data/hubSpotData");

const handleNewOnBoardData = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      useCase,
      company,
      companySize,
      chatAvailability,
      preferredTime,
      phone,
      country,
    } = req.body;

    const matchedUserData = await OnboardModel.findOne({
      email,
    });

    if (matchedUserData?.id) {
      return res.status(400).json({ message: "Onboarding Already Done" });
    }

    await OnboardModel.create({
      name,
      email,
      role,
      useCase,
      company,
      companySize,
      chatAvailability,
      preferredTime,
      phone,
      country,
    });

    if (chatAvailability == "yes" && !restrictedCountries.includes(country)) {
      const hubSpotData = {
        properties: {
          jobtitle: role,
          content: useCase,
          company: company,
          company_size: companySize,
          firstname: name,
          phone: phone,
          email: email,
          country: country,
          preferred_time: preferredTime,
          product: "GW",
          hs_lead_status: "NEW",
        },
      };
      await sendDataToHubSpot(hubSpotData);
    } else if (chatAvailability == "no") {
      const mailerLiteData = {
        properties: {
          jobtitle: role,
          content: useCase,
          company: company,
          company_size: companySize,
          firstname: name,
          phone: phone,
          email: email,
          country: country,
          preferred_time: preferredTime,
          chat_availability: chatAvailability,
        },
      };
      await sendDataToHubSpot(mailerLiteData);
    }

    res.status(200).json({ message: "Data Saved Successfully" });
    return;
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};

const getAllOnboardingDataById = async (req, res) => {
  try {
    /*
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

    const admin = await DashboardUser.findOne({ _id: decodedToken.id });

    if (!admin) {
      return res
        .status(401)
        .json({ message: "not authorized, Please contact your admin" });
    }
    // */
    const { id } = req.params;

    // fIND sessionToken in DB
    const matchedData = await OnboardModel.findById({
      _id: id,
    });

    if (!matchedData) {
      res.status(200).json({ message: "Data not found" });
      return;
    }

    res.status(200).json(matchedData);
    return;
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllOnboardingData = async (req, res) => {
  try {
    /*
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

    const admin = await DashboardUser.findOne({ _id: decodedToken.id });

    if (!admin) {
      return res
        .status(401)
        .json({ message: "not authorized, Please contact your admin" });
    }

    // */

    const allOnboardingData = await OnboardModel.find();

    res.status(200).json(allOnboardingData);
    return;
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleNewOnBoardData,
  getAllOnboardingData,
  getAllOnboardingDataById,
};
