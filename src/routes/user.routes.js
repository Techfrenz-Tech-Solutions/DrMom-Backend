const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { getProfile, getEnrolledCourses, getPurchaseHistory, getProgress, upsertProgress } = require("../controllers/user.controller");

const progressSchema = z.object({
  body: z.object({
    lessonId: z.string().min(1),
    watchedSeconds: z.number().int().min(0).max(86400).optional(),
    completed: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const router = express.Router();

router.use(requireAuth);
router.get("/me", getProfile);
router.get("/me/enrollments", getEnrolledCourses);
router.get("/me/orders", getPurchaseHistory);
router.get("/me/progress", getProgress);
router.post("/me/progress", validate(progressSchema), upsertProgress);

module.exports = router;
