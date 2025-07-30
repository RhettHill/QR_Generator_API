const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const generateRoute = require('./routes/generate');

function enforceRapidApiPlan(req, res, next) {
  const userPlan = req.header("X-RapidAPI-Plan");
  const userKey = req.header("X-RapidAPI-Key");

  if (!userKey || !userPlan) {
    return res.status(403).json({ error: "Missing RapidAPI headers." });
  }

  // Normalize plan
  const plan = userPlan.toLowerCase();

  // Store the plan for later use in routes
  req.userPlan = plan;
  req.isProUser = plan === "pro" || plan === "ultra" || plan === "mega";

  next();
}



// Middleware to check the subscription tier
function checkSubscriptionTier(req, res, next) {
  const plan = req.headers['x-rapidapi-plan'];

  if (!plan) {
    return res.status(401).json({ error: 'Missing plan info from RapidAPI' });
  }

  if (plan.toLowerCase() === 'basic') {
    req.userTier = 'free';
  } else if (plan.toLowerCase() === 'pro') {
    req.userTier = 'pro';
  } else {
    req.userTier = 'unknown';
  }

  next();
}


// Apply subscription check before route handler
app.use('/api/generate', checkSubscriptionTier, generateRoute);

// Optional route for tier status testing
app.get('/api/status', checkSubscriptionTier, (req, res) => {
  if (req.userTier === 'free') {
    return res.json({
      message: 'Limited access for free users',
      maxResults: 5,
    });
  } else if (req.userTier === 'pro') {
    return res.json({
      message: 'Full access granted',
      maxResults: 20,
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('QR Code API is live. Use POST /api/generate');
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
