const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { env } = require("../config/env");
const { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } = require("../utils/jwt");
const { AppError } = require("../utils/http");

const accessCookieName = "accessToken";
const refreshCookieName = "refreshToken";

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  // SameSite=None required for cross-subdomain (api.x.com ↔ app.x.com) on HTTPS.
  // Fall back to Lax on plain HTTP dev so browsers don't reject the cookie.
  sameSite: env.cookieSecure ? "none" : "lax",
  secure: env.cookieSecure,
  domain: env.cookieDomain,
  path: "/",
  maxAge,
});

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  gradeLabel: user.gradeLabel,
  phone: user.phone,
  createdAt: user.createdAt,
});

const issueSession = async (user, res) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    },
  });

  res.cookie(accessCookieName, accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie(refreshCookieName, refreshToken, getCookieOptions(env.refreshTokenTtlDays * 24 * 60 * 60 * 1000));

  return { accessToken, refreshToken };
};

const clearSessionCookies = (res) => {
  res.clearCookie(accessCookieName, { path: "/", domain: env.cookieDomain });
  res.clearCookie(refreshCookieName, { path: "/", domain: env.cookieDomain });
};

const registerUser = async ({ name, email, password, gradeLabel, phone }) => {
  email = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      gradeLabel,
      phone,
    },
  });
};

const loginUser = async ({ email, password }) => {
  email = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, "Invalid email or password");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError(401, "Invalid email or password");
  if (!user.isActive) throw new AppError(403, "Account is inactive");
  return user;
};

const rotateRefreshToken = async (refreshToken, res) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new AppError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const dbToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new AppError(401, "Account is inactive");

  await prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });

  await issueSession(user, res);
  return user;
};

module.exports = {
  sanitizeUser,
  issueSession,
  clearSessionCookies,
  registerUser,
  loginUser,
  rotateRefreshToken,
};
