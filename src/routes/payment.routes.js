const express = require("express");
const { createPaymentOrder, verifyPayment, handleWebhook } = require("../controllers/payment.controller");
const { requireAuth } = require("../middlewares/auth");
const { paymentLimiter } = require("../middlewares/rateLimiters");
const { validate } = require("../middlewares/validate");
const { createOrderSchema, verifyPaymentSchema } = require("../schemas/payment.schemas");

const router = express.Router();

router.post("/webhook", handleWebhook);
router.post("/orders", requireAuth, paymentLimiter, validate(createOrderSchema), createPaymentOrder);
router.post("/verify", requireAuth, paymentLimiter, validate(verifyPaymentSchema), verifyPayment);

module.exports = router;
