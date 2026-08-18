const express = require("express");
const cors = require("cors");

const router = require("./routes");
const { PORT, MONGO_URI } = require("./utils/keys");
const mongoose = require("mongoose");

//routes
const dashboardUserRoutes = require("./routes/dashboardUserRoutes");
const onBoardRoutes = require("./routes/onBoardRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));

app.use("/", router);
app.use(dashboardUserRoutes);
app.use(onBoardRoutes);

// Set strictPopulate to false globally
mongoose.set("strictPopulate", false);

mongoose.connect(MONGO_URI).then(() => console.log("Database connected... 🔗"));

app.listen(PORT, () => console.log(`Server started at port ${PORT}... 🚀`));
