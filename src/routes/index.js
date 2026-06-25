const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const courseRoutes = require("./course.routes");
const paymentRoutes = require("./payment.routes");
const adminRoutes = require("./admin.routes");
const { optionalAuth } = require("../middlewares/auth");
const { getCatalog } = require("../controllers/course.controller");
const { submitContact } = require("../controllers/contact.controller");
const { generalLimiter, contactLimiter } = require("../middlewares/rateLimiters");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

router.get("/catalog", generalLimiter, optionalAuth, getCatalog);
router.post("/contact", contactLimiter, submitContact);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", generalLimiter, courseRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
