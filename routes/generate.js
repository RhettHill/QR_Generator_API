const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const sharp = require('sharp');
const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const {
    text,
    format = 'base64',
    color,
    bgColor,
    width,
    errorCorrectionLevel,
    logo
  } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing "text" field in request body' });
  }

  // Build options, use request params or fallback to defaults
  const options = {
    color: {
      dark: color || '#000000',
      light: bgColor || '#FFFFFF',
    },
    width: width || 256,
    errorCorrectionLevel: errorCorrectionLevel || 'M',
  };

  try {
    const qrBuffer = await QRCode.toBuffer(text, options);

    if (logo) {
      // No plan check here, allow logo embedding for all users
      const qrImage = sharp(qrBuffer);

      let logoBuffer;
      if (logo.startsWith('http')) {
        const response = await fetch(logo);
        if (!response.ok) throw new Error('Failed to fetch logo image');
        logoBuffer = await response.buffer();
      } else if (logo.startsWith('data:image')) {
        const base64Data = logo.split(',')[1];
        logoBuffer = Buffer.from(base64Data, 'base64');
      } else {
        return res.status(400).json({ error: "Logo must be a URL or base64-encoded image." });
      }

      const qrMetadata = await qrImage.metadata();
      const logoSize = Math.floor(qrMetadata.width * 0.2);

      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain' })
        .toBuffer();

      const composited = await qrImage
        .composite([{ input: resizedLogo, gravity: 'center' }])
        .png()
        .toBuffer();

      if (format === 'base64') {
        return res.json({ image: `data:image/png;base64,${composited.toString('base64')}` });
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename=qr.png');
      return res.send(composited);
    }

    // No logo
    switch (format) {
      case 'base64': {
        const dataUrl = await QRCode.toDataURL(text, options);
        return res.json({ image: dataUrl });
      }
      case 'png': {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename=qrcode.png');
        return res.send(qrBuffer);
      }
      case 'svg': {
        const svg = await QRCode.toString(text, { ...options, type: 'svg' });
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', 'attachment; filename=qrcode.svg');
        return res.send(svg);
      }
      default:
        return res.status(400).json({ error: 'Invalid format. Use "base64", "png", or "svg".' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'QR code generation failed' });
  }
});

module.exports = router;
