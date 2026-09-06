require("dotenv").config();
const app = require("./src/app.js");
const connectDB = require("./src/config/database.js");
const invokeGeminiAi = require("./src/service/ai.service.js")

connectDB();
invokeGeminiAi();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
