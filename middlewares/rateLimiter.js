import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 req, per 15min
  message: {
    error: "Too many attempts. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req, res) => {
    if (req.adminId) return 300; // if admin, use 300
    if (req.customerId) return 200;
    return 100; // guest
  },
  message: {
    error: "Rate limit exceeded. Try again later.",
  },
  keyGenerator: (req, res) => {
    if (req.adminId) return `admin:${req.adminId}`;
    if (req.customerId) return `customer:${req.customerId}`;
    //  use helper for IP normalization
    return `guest:${ipKeyGenerator(req, res)}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // very strict to prevent fraud
  message: { error: "Too many payment attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) =>
    req.customerId
      ? `customer:${req.customerId}`
      : `guest:${ipKeyGenerator(req, res)}`, // normalize IPs
});

export { authLimiter, apiLimiter, paymentLimiter };
