import rateLimit from 'express-rate-limit';

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 attempts per window
  keyGenerator: (req) => {
    const ip = req.ip === '::1' ? '127.0.0.1' : req.ip;
    console.log(`[RATE LIMIT] Tracking IP: ${ip}`);
    return ip || 'unknown-ip';
  },
  handler: (req, res) => {
    console.warn(
      `[RATE LIMIT] Blocked IP: ${req.ip} due to too many attempts.`,
    );
    res.status(429).json({
      error: true,
      msg: 'Too many login attempts from this IP, please try again later.',
    });
  },
  standardHeaders: true, // Set rate limit headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

export { loginRateLimiter };
