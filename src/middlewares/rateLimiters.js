const rateLimit = require("express-rate-limit");

// Auth limiter: keyed on socket IP (not X-Forwarded-For) + email so that
// rotating the X-Forwarded-For header cannot bypass the limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use the real socket IP, never trust the X-Forwarded-For header alone
    const ip = req.socket?.remoteAddress || "unknown";
    const email = (req.body?.email || "").toLowerCase().trim();
    return `auth:${ip}:${email}`;
  },
  message: { success: false, message: "Too many auth attempts. Try again later." },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.socket?.remoteAddress || "unknown";
    return `payment:${ip}`;
  },
  message: { success: false, message: "Too many payment requests. Try again later." },
});

// General API limiter — DoS protection on public listing endpoints
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.socket?.remoteAddress || "unknown",
  message: { success: false, message: "Too many requests. Slow down." },
});

// Strict limiter for expensive admin operations (Bunny API calls, enrollment changes)
const adminActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.socket?.remoteAddress || "unknown";
    const userId = req.user?.id || "anon";
    return `admin:${ip}:${userId}`;
  },
  message: { success: false, message: "Too many admin requests. Try again later." },
});

// Contact form limiter
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.socket?.remoteAddress || "unknown",
  message: { success: false, message: "Too many messages sent. Try again in an hour." },
});

module.exports = { authLimiter, paymentLimiter, generalLimiter, adminActionLimiter, contactLimiter };
