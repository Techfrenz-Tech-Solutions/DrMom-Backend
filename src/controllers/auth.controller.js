const { asyncHandler, AppError } = require("../utils/http");
const {
  sanitizeUser,
  issueSession,
  clearSessionCookies,
  registerUser,
  loginUser,
  rotateRefreshToken,
} = require("../services/auth.service");
const { hashToken } = require("../utils/jwt");

const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.validated.body);
  await issueSession(user, res);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await loginUser(req.validated.body);
  await issueSession(user, res);

  res.json({
    success: true,
    message: "Login successful",
    user: sanitizeUser(user),
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clearSessionCookies(res);
  res.json({ success: true, message: "Logged out" });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) throw new AppError(401, "Refresh token missing");

  const user = await rotateRefreshToken(refreshToken, res);

  res.json({
    success: true,
    message: "Session refreshed",
    user: sanitizeUser(user),
  });
});

module.exports = { register, login, logout, me, refresh };
