const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

router.post('/', async (req, res) => {
  const { text, format } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing "text" field in request body' });
  }

  try {
    if (format === 'base64') {
      const dataUrl = await QRCode.toDataURL(text);
      return res.json({ image: dataUrl });
    } else {
      const buffer = await QRCode.toBuffer(text);
      res.setHeader('Content-Type', 'image/png');
      return res.send(buffer);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'QR code generation failed' });
  }
});

module.exports = router;
