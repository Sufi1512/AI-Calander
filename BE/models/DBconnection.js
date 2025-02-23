const mongoose = require('mongoose');
require('dotenv').config();

const DB_url = process.env.DB_URL;
mongoose.connect(DB_url)
  .then(() => console.log('DB connected'))
  .catch((err) => console.log(err));