const express = require("express");
const { z } = require("zod");
const {
  listAdminCatalog,
  getDashboard,
  listAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  createClass,
  updateClass,
  deleteClass,
  createSubject,
  updateSubject,
  deleteSubject,
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCoursePrice,
  updateLessonPrice,
  deleteCoursePrice,
  deleteLessonPrice,
  updateChapterPrice,
  updateClassPrice,
  updateSubjectPrice,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listPayments,
  listEnrolledUsers,
  grantEnrollment,
  revokeEnrollment,
} = require("../controllers/admin.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { adminActionLimiter } = require("../middlewares/rateLimiters");
const { initUpload, getVideoStatus } = require("../controllers/bunny.controller");
const { uploadChapterFileMiddleware, uploadChapterFile } = require("../controllers/upload.controller");
const {
  adminCourseSchema,
  adminLessonSchema,
  adminClassSchema,
  adminSubjectSchema,
  adminChapterSchema,
  adminUserSchema,
  adminCoursePriceSchema,
  adminLessonPriceSchema,
  adminChapterPriceSchema,
  adminClassPriceSchema,
  adminSubjectPriceSchema,
} = require("../schemas/course.schemas");

const publishSchema = z.object({
  params: z.object({ courseId: z.string().min(1) }),
  body: z.object({ status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional() }).optional(),
  query: z.object({}).optional(),
});

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/catalog", listAdminCatalog);
router.get("/dashboard", getDashboard);

router.post("/classes", validate(adminClassSchema), createClass);
router.put("/classes/:classId", validate(adminClassSchema), updateClass);
router.delete("/classes/:classId", deleteClass);
router.patch("/classes/price", validate(adminClassPriceSchema), updateClassPrice);

router.post("/subjects", validate(adminSubjectSchema), createSubject);
router.put("/subjects/:subjectId", validate(adminSubjectSchema), updateSubject);
router.delete("/subjects/:subjectId", deleteSubject);
router.patch("/subjects/price", validate(adminSubjectPriceSchema), updateSubjectPrice);

router.post("/chapters", validate(adminChapterSchema), createChapter);
router.put("/chapters/:chapterId", validate(adminChapterSchema), updateChapter);
router.delete("/chapters/:chapterId", deleteChapter);
router.patch("/chapters/:chapterId/price", validate(adminChapterPriceSchema), updateChapterPrice);

router.get("/courses", listAdminCourses);
router.post("/courses", validate(adminCourseSchema), createCourse);
router.put("/courses/:courseId", validate(adminCourseSchema), updateCourse);
router.delete("/courses/:courseId", deleteCourse);
router.patch("/courses/:courseId/publish", validate(publishSchema), publishCourse);
router.patch("/courses/:courseId/price", validate(adminCoursePriceSchema), updateCoursePrice);
router.delete("/courses/:courseId/price", deleteCoursePrice);

router.post("/courses/:courseId/lessons", validate(adminLessonSchema), createLesson);
router.put("/courses/:courseId/lessons/:lessonId", validate(adminLessonSchema), updateLesson);
router.delete("/courses/:courseId/lessons/:lessonId", deleteLesson);
router.patch("/lessons/:lessonId/price", validate(adminLessonPriceSchema), updateLessonPrice);
router.delete("/lessons/:lessonId/price", deleteLessonPrice);

router.get("/users", listUsers);
router.post("/users", validate(adminUserSchema), createUser);
router.put("/users/:userId", validate(adminUserSchema), updateUser);
router.delete("/users/:userId", deleteUser);

router.get("/orders", listPayments);
router.get("/enrollments", listEnrolledUsers);
router.post("/enrollments", adminActionLimiter, grantEnrollment);
router.delete("/enrollments/:enrollmentId", revokeEnrollment);

router.post("/bunny/videos/init", adminActionLimiter, initUpload);
router.get("/bunny/videos/:guid/status", getVideoStatus);

router.post("/uploads/chapter-file", adminActionLimiter, uploadChapterFileMiddleware, uploadChapterFile);

module.exports = router;
