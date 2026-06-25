const express = require("express");
const { register, login, logout, me, refresh } = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimiters");
const { validate } = require("../middlewares/validate");
const { registerSchema, loginSchema } = require("../schemas/auth.schemas");

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);

module.exports = router;
