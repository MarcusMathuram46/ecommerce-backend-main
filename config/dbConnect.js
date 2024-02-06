// dbConnect.js or wherever you establish MongoDB connection

const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      // Remove useNewUrlParser as it's deprecated and unnecessary
      // Remove useUnifiedTopology as it's deprecated and unnecessary
      // These options are automatically handled by Mongoose >= 6.0.0
    });

    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
};

module.exports = dbConnect;
