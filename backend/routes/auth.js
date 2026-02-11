const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const { validateSignup, validateLogin, validatePasswordReset, validateOTP } = require("../middleware/validation");
const { authLimiter, otpLimiter, generalLimiter, clearAllRateLimits, clearRateLimit, getRateLimitStatus } = require("../middleware/rateLimiter");

router.get("/me", auth.me);
router.get("/test-session", auth.testSession);
router.post("/signup", generalLimiter, validateSignup, auth.signup);
router.post("/login", authLimiter, validateLogin, auth.login);
router.post("/logout", auth.logout);
router.post("/forgot-password", otpLimiter, auth.sendOTP);
router.post("/verify-otp", authLimiter, validateOTP, auth.verifyOTP);
router.post("/update-password", authLimiter, validatePasswordReset, auth.updatePassword);

if (process.env.NODE_ENV !== 'production') {
  router.post("/clear-rate-limit", (req, res) => {
    const { ip } = req.body;
    if (ip) {
      clearRateLimit(ip);
      res.json({ msg: `Rate limit cleared for IP: ${ip}` });
    } else {
      clearAllRateLimits();
      res.json({ msg: "All rate limits cleared" });
    }
  });
  
  router.get("/rate-limit-status", (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.ip ||
               'unknown';
    const status = getRateLimitStatus(ip);
    res.json({ ip, ...status });
  });
}

module.exports = router;

