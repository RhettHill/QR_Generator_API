const express = require('express');
const QRCode = require('qrcode');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});


// Apply the middleware to all routes in this router


router.post('/', async (req, res) => {
  
const { data, size, foregroundColor, logoUrl } = req.body;
  const plan = req.userPlan;

  if (plan === 'free') {
    if (size && size > 300) {
      return res.status(403).json({ error: 'Custom sizes require a paid plan.' });
    }
    if (foregroundColor || logoUrl) {
      return res.status(403).json({ error: 'Color/logo customization is a Pro feature.' });
    }
  }
  
  

  if (!text) {
    return res.status(400).json({ error: 'Missing required field: text' });
  }

  const options = {
    width: size,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  };

  try {
    if (format === 'base64') {
      const dataUrl = await QRCode.toDataURL(text, options);
      return res.json({ base64: dataUrl });
    } else if (format === 'svg') {
      const svg = await QRCode.toString(text, { type: 'svg', ...options });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    } else {
      res.setHeader('Content-Type', 'image/png');
      QRCode.toFileStream(res, text, options);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});


module.exports = router;
