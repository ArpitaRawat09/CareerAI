const express = require('express');
const authRouter = require('./routes/auth.route.js');

const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);


module.exports = app;