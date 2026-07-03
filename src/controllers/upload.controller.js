const crypto = require("crypto");
const multer = require("multer");
const { asyncHandler, AppError } = require("../utils/http");
const { env } = require("../config/env");
const { uploadToBunnyStorage, signStorageUrl, isBunnyStorageConfigured } = require("../utils/bunnyStorage");

// Only document types the Chapters.jsx PDF/notes field actually accepts
// (accept=".pdf,.doc,.docx"). Anything else — including executables — is rejected.
const ALLOWED_MIME_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// memoryStorage: the file only ever exists as an in-request buffer — it's
// never written to the backend's disk, and the buffer is discarded once the
// request completes (whether the Bunny upload succeeds or fails).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      return cb(new AppError(415, "Only PDF, DOC, or DOCX files are allowed"));
    }
    cb(null, true);
  },
});

// Wraps multer so its errors (oversized file, rejected type) come out as the
// same AppError/JSON shape as the rest of the API instead of a raw 500.
const uploadChapterFileMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(413, `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
    }
    if (err instanceof AppError) return next(err);
    return next(new AppError(400, err.message || "Upload failed"));
  });
};

// A chapter being created for the first time doesn't have an id yet — only
// trust a caller-supplied chapterId as a path segment if it looks like a
// real Prisma cuid, otherwise fall back to a temp bucket. Never derive any
// part of the storage path from the original filename (path traversal).
const isLikelyCuid = (value) => /^[a-z0-9]{20,32}$/i.test(value || "");

const uploadChapterFile = asyncHandler(async (req, res) => {
  if (!isBunnyStorageConfigured()) {
    throw new AppError(503, "File storage is not configured on this server");
  }
  if (!req.file) throw new AppError(400, "No file uploaded");

  const ext = ALLOWED_MIME_TYPES[req.file.mimetype];
  const safeFileName = `${crypto.randomUUID()}.${ext}`;
  const chapterSegment = isLikelyCuid(req.body?.chapterId) ? req.body.chapterId : "temp";
  const storagePath = `${env.bunnyStorageUploadFolder}/${chapterSegment}/${safeFileName}`;

  await uploadToBunnyStorage(storagePath, req.file.buffer, req.file.mimetype);

  res.status(201).json({
    success: true,
    storagePath,
    fileName: safeFileName,
    mimeType: req.file.mimetype,
    size: req.file.size,
    provider: "bunny-storage",
    // Short-lived — for the admin UI to optionally preview what was just
    // uploaded. Never a permanent public URL.
    previewUrl: signStorageUrl(storagePath, 300),
  });
});

module.exports = { uploadChapterFileMiddleware, uploadChapterFile };
