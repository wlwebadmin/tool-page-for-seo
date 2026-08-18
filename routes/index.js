const express = require("express");

const { processPrompt } = require("../controller/processPrompt");

const router = express.Router();

router.post("/processPrompt", processPrompt);

module.exports = router;
