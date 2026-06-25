const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { getProfile, getEnrolledCourses, getPurchaseHistory } = require("../controllers/user.controller");

const router = express.Router();

router.use(requireAuth);
router.get("/me", getProfile);
router.get("/me/enrollments", getEnrolledCourses);
router.get("/me/orders", getPurchaseHistory);

module.exports = router;
