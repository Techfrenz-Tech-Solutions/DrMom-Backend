const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { env } = require("../config/env");

// Reuses the existing JWT access secret for these short-lived, purpose-scoped
// tokens rather than introducing a second secret to configure. Each token
// carries an explicit `purpose` claim that is checked on verification, so it
// can never be confused with (or replayed as) a real session access token —
// requireAuth() only accepts tokens whose `sub` resolves to a real user id
// via a DB lookup, which these tokens don't attempt to satisfy.
const OAUTH_STATE_TTL = "10m";
const PENDING_SIGNUP_TTL = "15m";

const googleClient = () => new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleCallbackUrl);

const isGoogleConfigured = () =>
  Boolean(env.googleClientId && env.googleClientSecret && env.googleCallbackUrl && env.frontendUrl);

// ─── OAuth `state` param — CSRF protection + carries `mode` tamper-safely ───
const signOAuthState = (mode) =>
  jwt.sign(
    { purpose: "google_oauth_state", mode, nonce: crypto.randomBytes(16).toString("hex") },
    env.jwtAccessSecret,
    { expiresIn: OAUTH_STATE_TTL },
  );

const verifyOAuthState = (state) => {
  const payload = jwt.verify(state, env.jwtAccessSecret);
  if (payload.purpose !== "google_oauth_state") throw new Error("Invalid state purpose");
  return payload;
};

// ─── Pending signup token — handed to the frontend after Google auth for a
// brand-new user; nothing is persisted to the User table until the details
// form is submitted and this token is re-verified. ───
const signPendingSignupToken = ({ providerUserId, email, emailVerified, name, mode }) =>
  jwt.sign(
    { purpose: "google_pending_signup", providerUserId, email, emailVerified, name, mode },
    env.jwtAccessSecret,
    { expiresIn: PENDING_SIGNUP_TTL },
  );

const verifyPendingSignupToken = (token) => {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  if (payload.purpose !== "google_pending_signup") throw new Error("Invalid pending-signup token purpose");
  return payload;
};

const buildGoogleAuthUrl = (mode) => {
  const client = googleClient();
  const state = signOAuthState(mode);
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
};

const exchangeCodeForIdToken = async (code) => {
  const client = googleClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error("Google did not return an id_token");
  return tokens.id_token;
};

// Verifies signature, issuer, audience, and expiry against Google's public
// keys via google-auth-library — this is the same official verification path
// Google's own docs recommend, not a hand-rolled JWT check.
const verifyGoogleIdToken = async (idToken) => {
  const client = googleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error("Google ID token had no payload");
  if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
    throw new Error("Unexpected token issuer");
  }
  return payload; // { sub, email, email_verified, name, ... }
};

module.exports = {
  isGoogleConfigured,
  signOAuthState,
  verifyOAuthState,
  signPendingSignupToken,
  verifyPendingSignupToken,
  buildGoogleAuthUrl,
  exchangeCodeForIdToken,
  verifyGoogleIdToken,
};
