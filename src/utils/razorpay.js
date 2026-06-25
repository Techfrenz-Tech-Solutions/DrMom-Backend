const crypto = require("crypto");
const Razorpay = require("razorpay");
const { env } = require("../config/env");

const razorpayClient =
  env.razorpayKeyId && env.razorpayKeySecret
    ? new Razorpay({
        key_id: env.razorpayKeyId,
        key_secret: env.razorpayKeySecret,
      })
    : null;

const verifyRazorpayPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!env.razorpayKeySecret) return false;
  const digest = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return digest === signature;
};

const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  if (!env.razorpayWebhookSecret || !signature) return false;
  const digest = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return digest === signature;
};

module.exports = {
  razorpayClient,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
};
