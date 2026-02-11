
const requestLog = new Map();

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
};

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    maxRequests = 100, // max requests per window
    message = "Too many requests, please try again later"
  } = options;

  return (req, res, next) => {
    const identifier = getClientIP(req);
    const now = Date.now();

    if (!requestLog.has(identifier)) {
      requestLog.set(identifier, []);
    }

    const requests = requestLog.get(identifier);

    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      const retryAfter = Math.ceil((validRequests[0] + windowMs - now) / 1000 / 60); // minutes
      return res.status(429).json({ 
        msg: message,
        retryAfter: retryAfter,
        retryAfterMinutes: retryAfter
      });
    }

    validRequests.push(now);
    requestLog.set(identifier, validRequests);

    if (Math.random() < 0.01) { // 1% chance
      cleanupOldEntries(windowMs);
    }

    next();
  };
};

const cleanupOldEntries = (windowMs) => {
  const now = Date.now();
  for (const [identifier, requests] of requestLog.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    if (validRequests.length === 0) {
      requestLog.delete(identifier);
    } else {
      requestLog.set(identifier, validRequests);
    }
  }
};

exports.authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts (increased from 5 for better UX)
  message: "Too many login attempts, please try again later"
});

exports.otpLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 OTP requests
  message: "Too many OTP requests, please try again later"
});

exports.generalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests
  message: "Too many requests, please try again later"
});

exports.clearRateLimit = (ip) => {
  if (ip) {
    requestLog.delete(ip);
    return true;
  }
  return false;
};

exports.clearAllRateLimits = () => {
  requestLog.clear();
  return true;
};

exports.getRateLimitStatus = (ip) => {
  if (!requestLog.has(ip)) {
    return { remaining: 10, resetIn: 0 };
  }
  
  const requests = requestLog.get(ip);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10;
  
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  const remaining = Math.max(0, maxRequests - validRequests.length);
  const oldestRequest = validRequests.length > 0 ? validRequests[0] : now;
  const resetIn = Math.max(0, Math.ceil((oldestRequest + windowMs - now) / 1000 / 60)); // minutes
  
  return {
    remaining,
    resetIn,
    used: validRequests.length,
    max: maxRequests
  };
};


