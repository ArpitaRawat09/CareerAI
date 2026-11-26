const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

module.exports = connectDB;

// mongodb+srv://arpitarawat381_db_user:flWO1bUhuGacgLbZ@careerai-cluster.f2shmq7.mongodb.net/
