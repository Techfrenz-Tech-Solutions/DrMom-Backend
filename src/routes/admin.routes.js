const express = require("express");
const {
  listAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  listPayments,
  listEnrolledUsers,
} = require("../controllers/admin.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { adminCourseSchema, adminLessonSchema } = require("../schemas/course.schemas");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/courses", listAdminCourses);
router.post("/courses", validate(adminCourseSchema), createCourse);
router.put("/courses/:courseId", validate(adminCourseSchema), updateCourse);
router.delete("/courses/:courseId", deleteCourse);
router.patch("/courses/:courseId/publish", publishCourse);

router.post("/courses/:courseId/lessons", validate(adminLessonSchema), createLesson);
router.put("/courses/:courseId/lessons/:lessonId", validate(adminLessonSchema), updateLesson);
router.delete("/courses/:courseId/lessons/:lessonId", deleteLesson);

router.get("/orders", listPayments);
router.get("/enrollments", listEnrolledUsers);

module.exports = router;
