const express = require("express");
const {
  listCourses,
  getCatalog,
  getCourse,
  getLessonAccess,
  getLessonPlaybackDetails,
  getChapterPdfMaterialDetails,
} = require("../controllers/course.controller");
const { requireAuth, optionalAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/lessons/:lessonId/access", optionalAuth, getLessonAccess);
router.get("/lessons/:lessonId/playback", requireAuth, getLessonPlaybackDetails);
// Registered before the "/:slug" catch-all below so "chapters" is never
// swallowed as a course slug.
router.get("/chapters/:chapterId/materials/pdf", requireAuth, getChapterPdfMaterialDetails);
router.get("/", listCourses);
router.get("/:slug", optionalAuth, getCourse);

module.exports = router;
