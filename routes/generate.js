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

// Middleware to validate API key and track usage
 async function validateApiKey(req, res, next) {
  const key = req.header('x-api-key');
  if (!key) return res.status(400).json({ error: 'Missing API key' });

  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1 AND is_active = true',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    req.apiUser = result.rows[0]; // optional

    // Log usage
    await pool.query(
      'INSERT INTO usage_logs (api_key, endpoint, ip_address) VALUES ($1, $2, $3)',
      [key, req.originalUrl, req.ip]
    );

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Apply the middleware to all routes in this router
router.use(validateApiKey);

router.post('/', async (req, res) => {
  const {
    text,
    size = 300,
    darkColor = '#000000',
    lightColor = '#ffffff',
    format = 'png',
  } = req.body;

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

router.post('/create-key', async (req, res) => {
  const { email } = req.body; // optional user info

  if (!email) return res.status(400).json({ error: 'Missing email' });

  const newKey = generateApiKey();

  try {
    await pool.query(
      'INSERT INTO api_keys (key, user_email) VALUES ($1, $2)',
      [newKey, email]
    );
    res.json({ apiKey: newKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create API key' });
  }
});


module.exports = router;
