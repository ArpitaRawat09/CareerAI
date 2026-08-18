const express = require('express');
const cookieParser = require("cookie-parser");

/*  importing all the routes */
const authRouter = require('./routes/auth.route.js');


const app = express();

app.use(cookieParser());
app.use(express.json());

/*  using all the routes */
app.use('/api/auth', authRouter);


module.exports = app;