const { ZodError } = require("zod");

// Prisma error classes — imported lazily so the app boots even if Prisma isn't generated yet
let PrismaKnown, PrismaValidation;
try {
  const prismaRuntime = require("@prisma/client/runtime/library");
  PrismaKnown = prismaRuntime.PrismaClientKnownRequestError;
  PrismaValidation = prismaRuntime.PrismaClientValidationError;
} catch (_) {}

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    const flat = error.flatten();
    const fieldErrors = flat.fieldErrors;
    const parts = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${(msgs || []).join(", ")}`)
      .filter(Boolean);
    const message = parts.length ? parts.join("; ") : "Validation failed";
    return res.status(422).json({ success: false, message, errors: flat });
  }

  // Sanitize Prisma errors — never expose query internals, table names, or field details
  if (
    (PrismaKnown && error instanceof PrismaKnown) ||
    (PrismaValidation && error instanceof PrismaValidation)
  ) {
    return res.status(400).json({ success: false, message: "Invalid request data" });
  }

  const statusCode = error.statusCode || 500;
  // For unexpected 500s, don't leak error.message (could contain stack/db details)
  const message = error.statusCode
    ? error.message || "Request failed"
    : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || undefined,
  });
};

module.exports = { notFoundHandler, errorHandler };
