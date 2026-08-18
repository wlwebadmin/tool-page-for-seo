const mongoose = require("mongoose");

const onBoardDataSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
    },
    useCase: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
    companySize: {
      type: String,
    },
    chatAvailability: {
      type: String,
    },
    // preferredDate: {
    //   type: String,
    // },
    preferredTime: {
      type: String,
    },
    country: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const OnBoardData = mongoose.model(
  "onBoardData",
  onBoardDataSchema,
  "onBoardDatas"
);

module.exports = OnBoardData;
