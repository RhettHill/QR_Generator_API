const ipRangeCheck = require('ip-range-check');

// These are example IP ranges, replace with official RapidAPI IPs from docs
const rapidApiIpRanges = [
  '3.214.0.0/16',
  '3.211.0.0/16',
  '52.44.0.0/16',
  '52.46.0.0/16',
  '52.23.0.0/16',
  '34.213.0.0/16',
];

// Middleware to whitelist RapidAPI IPs
function rapidApiIpWhitelist(req, res, next) {
  // Get client IP — works behind proxies if you trust them
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // x-forwarded-for can contain multiple IPs — take the first
  const ip = clientIp.split(',')[0].trim();

  if (ipRangeCheck(ip, rapidApiIpRanges)) {
    // IP allowed
    return next();
  }

  // Block if not in whitelist
  return res.status(403).json({
    error: "Forbidden: your IP is not whitelisted. Access allowed only via RapidAPI proxy."
  });
}

module.exports = rapidApiIpWhitelist;
