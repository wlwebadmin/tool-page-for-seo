//router config

const dashboardUserRouter = require("express").Router();

const {
  registerUser,
  confirmUser,
  loginUser,
  updateUser,
  forgotPassword,
  resetPassword,
} = require("../controller/dashboardUserController");

dashboardUserRouter.post("/api/user/register", registerUser);
dashboardUserRouter.patch("/api/user/confirm/:id", confirmUser);
dashboardUserRouter.post("/api/user/login", loginUser);
dashboardUserRouter.patch("/api/user/updateuser", updateUser);
dashboardUserRouter.post("/api/user/forgotpassword", forgotPassword);
dashboardUserRouter.patch("/api/user/resetpassword/:resetToken", resetPassword);

module.exports = dashboardUserRouter;
