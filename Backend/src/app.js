const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

/*  importing all the routes */
const authRouter = require("./routes/auth.route.js");
const interviewRouter = require("./routes/interview.route.js");

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/*  using all the routes */
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;
