//router config

const onboardRouter = require("express").Router();

const {
  handleNewOnBoardData,
  getAllOnboardingData,
  getAllOnboardingDataById,
} = require("../controller/onBoardController");

onboardRouter.post("/api/onboarddata", handleNewOnBoardData);
onboardRouter.get("/api/onboarddata", getAllOnboardingData);
onboardRouter.get("/api/onboarddata/:id", getAllOnboardingDataById);

module.exports = onboardRouter;
