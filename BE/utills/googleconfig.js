const { google } = require("googleapis");
require("dotenv").config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID); // Debug
console.log("GOOGLE_CLIENT_SECRET:", GOOGLE_CLIENT_SECRET);

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "http://localhost:5173" // Frontend redirect URI
);

const calendar = google.calendar({ version: "v3" });
const gmail = google.gmail({ version: "v1" });

module.exports = {
  oAuth2Client,
  calendar,
  gmail,
};