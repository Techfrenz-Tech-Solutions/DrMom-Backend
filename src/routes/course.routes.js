const express = require("express");
const { listCourses, getCatalog, getCourse, getLessonAccess, getLessonPlaybackDetails } = require("../controllers/course.controller");
const { requireAuth, optionalAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/lessons/:lessonId/access", optionalAuth, getLessonAccess);
router.get("/lessons/:lessonId/playback", requireAuth, getLessonPlaybackDetails);
router.get("/", listCourses);
router.get("/:slug", optionalAuth, getCourse);

module.exports = router;
