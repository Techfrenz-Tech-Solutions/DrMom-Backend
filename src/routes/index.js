const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const courseRoutes = require("./course.routes");
const paymentRoutes = require("./payment.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
