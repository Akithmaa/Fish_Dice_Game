const { db } = require("./firebase");
const connectDB = async () => {
  try {
    await db.ref(".info/connected").once("value");
    console.log("Firebase Realtime DB Connected");

  } catch (err) {
    console.log(" Database connection failed:", err.message);
  }

};
module.exports = connectDB;


