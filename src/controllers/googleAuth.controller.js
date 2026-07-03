const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { env } = require("../config/env");
const { asyncHandler, AppError } = require("../utils/http");
const { sanitizeUser, issueSession } = require("../services/auth.service");
const {
  isGoogleConfigured,
  verifyOAuthState,
  signPendingSignupToken,
  verifyPendingSignupToken,
  buildGoogleAuthUrl,
  exchangeCodeForIdToken,
  verifyGoogleIdToken,
} = require("../utils/googleOAuth");

// Every redirect back to the frontend is built from FRONTEND_URL only —
// never from request input — so this can't be abused as an open redirect.
const redirectToFrontend = (res, path, params = {}) => {
  const url = new URL(path, env.frontendUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  res.redirect(url.toString());
};

const googleIdentityWhere = (providerUserId) => ({
  provider_providerUserId: { provider: "google", providerUserId },
});

const googleStart = asyncHandler(async (req, res) => {
  if (!isGoogleConfigured()) {
    throw new AppError(503, "Google sign-in is not configured on this server");
  }
  const mode = req.query.mode === "signup" ? "signup" : "login";
  res.redirect(buildGoogleAuthUrl(mode));
});

const googleCallback = asyncHandler(async (req, res) => {
  if (!isGoogleConfigured() || !env.frontendUrl) {
    throw new AppError(503, "Google sign-in is not configured on this server");
  }

  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return redirectToFrontend(res, "/login", { google_error: "OAUTH_CANCELLED" });
  }

  let statePayload;
  try {
    statePayload = verifyOAuthState(state);
  } catch (_err) {
    return redirectToFrontend(res, "/login", { google_error: "OAUTH_STATE_INVALID" });
  }

  let idToken;
  let googlePayload;
  try {
    idToken = await exchangeCodeForIdToken(code);
    googlePayload = await verifyGoogleIdToken(idToken);
  } catch (_err) {
    return redirectToFrontend(res, "/login", { google_error: "OAUTH_CALLBACK_FAILED" });
  }

  if (!googlePayload.email_verified) {
    return redirectToFrontend(res, "/login", { google_error: "GOOGLE_EMAIL_NOT_VERIFIED" });
  }

  const providerUserId = googlePayload.sub;
  const email = googlePayload.email.toLowerCase();

  // Case 1 — already linked: sign them in, regardless of which button (login/signup) they clicked.
  const identity = await prisma.userIdentity.findUnique({
    where: googleIdentityWhere(providerUserId),
    include: { user: true },
  });

  if (identity) {
    if (!identity.user.isActive) {
      return redirectToFrontend(res, "/login", { google_error: "OAUTH_CALLBACK_FAILED" });
    }
    await issueSession(identity.user, res);
    return redirectToFrontend(res, "/");
  }

  // Case 2 — email already registered under a password account, not linked to Google.
  // Do NOT auto-link on email match alone; that would allow account takeover
  // by anyone who controls a Google account with the same email address.
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    return redirectToFrontend(res, "/login", { google_error: "GOOGLE_ACCOUNT_NOT_LINKED" });
  }

  // Case 3 — brand-new user. No account is created yet; hand off a short-lived
  // pending-signup token so the frontend can collect required details first.
  const pendingToken = signPendingSignupToken({
    providerUserId,
    email,
    emailVerified: true,
    name: googlePayload.name || "",
    mode: statePayload.mode,
  });

  return redirectToFrontend(res, "/complete-signup", { token: pendingToken });
});

// Lets the complete-signup page show the verified Google email/name without
// the frontend ever decoding (or being trusted to display) the token itself.
const getPendingGoogleSignup = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new AppError(400, "Missing pending signup token", { code: "PENDING_SIGNUP_EXPIRED" });

  let payload;
  try {
    payload = verifyPendingSignupToken(token);
  } catch (_err) {
    throw new AppError(400, "This sign-up link has expired. Please start again.", { code: "PENDING_SIGNUP_EXPIRED" });
  }

  res.json({ success: true, email: payload.email, name: payload.name, mode: payload.mode });
});

const completeGoogleSignup = asyncHandler(async (req, res) => {
  const { pendingToken, name, gradeLabel, phone } = req.validated.body;

  let payload;
  try {
    payload = verifyPendingSignupToken(pendingToken);
  } catch (_err) {
    throw new AppError(400, "This sign-up link has expired. Please start again.", { code: "PENDING_SIGNUP_EXPIRED" });
  }

  if (!payload.emailVerified) {
    throw new AppError(400, "Google email is not verified.", { code: "GOOGLE_EMAIL_NOT_VERIFIED" });
  }

  const email = payload.email; // sourced only from the verified token, never from the request body

  const existingIdentity = await prisma.userIdentity.findUnique({
    where: googleIdentityWhere(payload.providerUserId),
  });

  if (existingIdentity) {
    // Already completed previously (e.g. duplicate submit) — just log them in.
    const user = await prisma.user.findUnique({ where: { id: existingIdentity.userId } });
    if (!user || !user.isActive) throw new AppError(403, "Account is inactive");
    await issueSession(user, res);
    return res.json({ success: true, message: "Login successful", user: sanitizeUser(user) });
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    throw new AppError(
      409,
      "An account with this email already exists. Please log in with your password, then link Google from your account.",
      { code: "EMAIL_ALREADY_EXISTS" },
    );
  }

  // Google-linked accounts never use a password, but passwordHash is required
  // by the schema — fill it with an unusable random value.
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: name.trim(),
        email,
        passwordHash,
        gradeLabel: gradeLabel || null,
        phone: phone || null,
      },
    });
    await tx.userIdentity.create({
      data: {
        userId: created.id,
        provider: "google",
        providerUserId: payload.providerUserId,
        email,
        emailVerified: true,
      },
    });
    return created;
  });

  await issueSession(user, res);
  res.status(201).json({ success: true, message: "Registration successful", user: sanitizeUser(user) });
});

module.exports = { googleStart, googleCallback, getPendingGoogleSignup, completeGoogleSignup };
