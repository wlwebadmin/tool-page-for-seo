const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userIP: String,
  usedTools: Array,
});

module.exports = mongoose.model("User", UserSchema);
