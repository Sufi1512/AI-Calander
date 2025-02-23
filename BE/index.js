require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const authRouter = require('./routes/authRouter');

const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 8080;

require('./models/DBconnection');

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/auth', authRouter);

app.use((req, res) => {
  console.log(`Unhandled route: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});