const express = require("express");
const {
  listCourses,
  getCatalog,
  getCourse,
  getLessonAccess,
  getLessonPlaybackDetails,
  getChapterMaterialsDetails,
  getChapterVideoPlaybackDetails,
} = require("../controllers/course.controller");
const { requireAuth, optionalAuth } = require("../middlewares/auth");

const router = express.Router();

// Legacy — retained because the Lesson table/data isn't being removed, not
// because the website still calls these (it doesn't; see course.service.js).
router.get("/lessons/:lessonId/access", optionalAuth, getLessonAccess);
router.get("/lessons/:lessonId/playback", requireAuth, getLessonPlaybackDetails);
// Registered before the "/:slug" catch-all below so "chapters" is never
// swallowed as a course slug. Returns all of the chapter's materials (a
// chapter can have more than one PDF/notes file), each signed individually.
router.get("/chapters/:chapterId/materials", requireAuth, getChapterMaterialsDetails);
// Current video playback path — website's VideoCard.jsx calls this.
router.get("/chapters/:chapterId/videos/:videoId/playback", requireAuth, getChapterVideoPlaybackDetails);
router.get("/", listCourses);
router.get("/:slug", optionalAuth, getCourse);

module.exports = router;
