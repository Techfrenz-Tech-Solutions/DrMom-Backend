const { prisma } = require("../lib/prisma");
const { verifyAccessToken } = require("../utils/jwt");
const { AppError, asyncHandler } = require("../utils/http");

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
};

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies.accessToken || getBearerToken(req);
  if (!token) {
    throw new AppError(401, "Authentication required");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new AppError(401, "Invalid or expired access token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      gradeLabel: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Account is inactive");
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies.accessToken || getBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gradeLabel: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (_error) {
    req.user = undefined;
  }

  next();
});

const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError(403, "Admin access required"));
  }
  next();
};

module.exports = { requireAuth, optionalAuth, requireAdmin };
