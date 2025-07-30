const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Check for RapidAPI key first — block unauthorized requests early
app.use((req, res, next) => {
  if (!req.headers['x-rapidapi-key']) {
    return res.status(403).json({ error: 'Forbidden: missing RapidAPI key header' });
  }
  next();
});

// Parse user plan header, add to req for route usage
app.use((req, res, next) => {
  const plan = req.headers['x-rapidapi-plan']; // 'basic', 'pro', etc.
  req.userPlan = plan ? plan.toLowerCase() : 'free'; // normalize
  next();
});

// Now mount your route(s)
const generateRoute = require('./routes/generate');
app.use('/api/generate', generateRoute);

// Root route for quick status check
app.get('/', (req, res) => {
  res.send('QR Code API is live. Use POST /api/generate');
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
