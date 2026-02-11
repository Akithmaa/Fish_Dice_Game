const { clearRateLimit, clearAllRateLimits } = require('../middleware/rateLimiter');
const ip = process.argv[2];

if (ip) {

  const cleared = clearRateLimit(ip);

  if (cleared) {
    console.log(`Rate limit cleared for IP: ${ip}`);
  } else {
    console.log(`No rate limit found for IP: ${ip}`);
  }

} else {

  clearAllRateLimits();
  console.log('All rate limits cleared');

}

process.exit(0);
