const express = require('express');
const authRouter = require('./routes/auth.route.js');
const cookieParser = require("cookie-parser");


const app = express();

app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRouter);


module.exports = app;