const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String },
  googleAccessToken: { type: String }, // Must be present
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('social-login', userSchema);