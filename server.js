const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const generateRoute = require('./routes/generate');





// Middleware to check the subscription tier
function ensureFromRapidApi(req, res, next) {
  const secret = req.header("X-RapidAPI-Proxy-Secret");
  if (secret !== process.env.RAPIDAPI_PROXY_SECRET) {
    return res.status(403).json({ error: "Forbidden: not from RapidAPI proxy." });
  }
  next();
}
function enforceRapidApiPlan(req, res, next) {
  const plan = req.header("X-RapidAPI-Plan");
  const key = req.header("X-RapidAPI-Key");

  if (!plan || !key) {
    return res.status(403).json({ error: "Missing RapidAPI headers." });
  }

  req.userPlan = plan.toLowerCase();
  req.isPro = ["pro", "ultra", "mega"].includes(req.userPlan);
  next();
}




app.use(ensureFromRapidApi);
app.use(enforceRapidApiPlan);
app.post('/api/generate', generateRoute);

// Root route
app.get('/', (req, res) => {
  res.send('QR Code API is live. Use POST /api/generate');
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
