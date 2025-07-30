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

  const isProUser = req.header("X-RapidAPI-Plan")?.toLowerCase() === "pro";
  if (!text) {
  return res.status(400).json({ error: 'Missing "text" field in request body' });
}

const attemptedProFeatures = [];

if (!isProUser) {
  if (color && color !== '#000000') attemptedProFeatures.push("color");
  if (bgColor && bgColor !== '#FFFFFF') attemptedProFeatures.push("bgColor");
  if (width && width !== 256) attemptedProFeatures.push("width");
  if (errorCorrectionLevel && errorCorrectionLevel !== 'M') attemptedProFeatures.push("errorCorrectionLevel");
  if (logo) attemptedProFeatures.push("logo");

  if (attemptedProFeatures.length > 0) {
    return res.status(403).json({
      error: `You are on the Free plan. The following features require a Pro plan: ${attemptedProFeatures.join(', ')}.`
    });
  }
}


  if (!text) {
    return res.status(400).json({ error: 'Missing "text" field in request body' });
  }

  // Set options based on user plan
  const options = {
    color: {
      dark: isProUser && color ? color : '#000000',
      light: isProUser && bgColor ? bgColor : '#FFFFFF',
    },
    width: isProUser && width ? width : 256,
    errorCorrectionLevel: isProUser && errorCorrectionLevel ? errorCorrectionLevel : 'M',
  };

  try {
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(text, options);

    if (logo) {
      if (!isProUser) {
        return res.status(403).json({ error: "Logo embedding is only available to Pro users." });
      }

      // Load the QR code buffer into sharp
      const qrImage = sharp(qrBuffer);

      // Load logo image (URL or base64)
      let logoBuffer;

      if (logo.startsWith('http')) {
        // Fetch remote logo image
        const fetch = require('node-fetch');
        const response = await fetch(logo);
        if (!response.ok) throw new Error('Failed to fetch logo image');
        logoBuffer = await response.buffer();
      } else if (logo.startsWith('data:image')) {
        // Base64 encoded image
        const base64Data = logo.split(',')[1];
        logoBuffer = Buffer.from(base64Data, 'base64');
      } else {
        return res.status(400).json({ error: "Logo must be a URL or base64-encoded image." });
      }

      // Resize logo to 20% of QR code width
      const qrMetadata = await qrImage.metadata();
      const logoSize = Math.floor(qrMetadata.width * 0.2);

      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain' })
        .toBuffer();

      // Composite logo onto QR code, centered
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

    // No logo case
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
