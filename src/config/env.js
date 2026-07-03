const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigins: parseOrigins(
    process.env.CORS_ORIGIN ||
      [process.env.FRONTEND_URL, process.env.ADMIN_FRONTEND_URL].filter(Boolean).join(","),
  ),
  frontendUrl: process.env.FRONTEND_URL || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSecure: String(process.env.COOKIE_SECURE || "false") === "true",
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "Admin User",
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "ChangeThis123!",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || "",
  bunnyCdnHost: process.env.BUNNY_STREAM_CDN_HOST || "iframe.mediadelivery.net",
  bunnyPullZone: process.env.BUNNY_STREAM_PULL_ZONE || "",
  bunnyTokenAuthKey: process.env.BUNNY_TOKEN_AUTH_KEY || "",
  bunnyApiKey: process.env.BUNNY_API_KEY || "",
  courseAccessDays: Number(process.env.COURSE_ACCESS_DAYS || 0), // 0 = perpetual
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "",
  // Bunny Storage — for PDF/notes files only. Deliberately separate from the
  // Bunny Stream vars above; do not reuse Stream credentials here.
  bunnyStorageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || "",
  bunnyStorageAccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY || "",
  bunnyStorageEndpoint: process.env.BUNNY_STORAGE_ENDPOINT || "https://storage.bunnycdn.com",
  bunnyStoragePullZoneUrl: process.env.BUNNY_STORAGE_PULL_ZONE_URL || "",
  bunnyStorageUploadFolder: process.env.BUNNY_STORAGE_UPLOAD_FOLDER || "chapters",
  bunnyStorageSigningKey: process.env.BUNNY_STORAGE_SIGNING_KEY || "",
  bunnyStoragePrivateAccess: String(process.env.BUNNY_STORAGE_PRIVATE_ACCESS ?? "true") === "true",
};

module.exports = { env };
