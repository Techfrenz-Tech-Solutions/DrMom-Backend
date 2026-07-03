const crypto = require("crypto");
const { env } = require("../config/env");

// Bunny Storage is used only for PDF/notes files. Deliberately isolated from
// utils/bunny.js (Bunny Stream, video) — separate zone, separate credentials.

const isBunnyStorageConfigured = () =>
  Boolean(env.bunnyStorageZoneName && env.bunnyStorageAccessKey && env.bunnyStorageEndpoint);

const isSignedDeliveryConfigured = () =>
  Boolean(env.bunnyStoragePullZoneUrl && env.bunnyStorageSigningKey);

// Raw binary PUT to Bunny Storage. AccessKey = the storage zone password.
// https://docs.bunny.net/storage/http
const uploadToBunnyStorage = async (storagePath, buffer, mimeType) => {
  if (!isBunnyStorageConfigured()) {
    throw new Error("Bunny Storage is not configured on this server");
  }

  const url = `${env.bunnyStorageEndpoint.replace(/\/$/, "")}/${env.bunnyStorageZoneName}/${storagePath}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: env.bunnyStorageAccessKey,
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny Storage upload failed (${res.status}): ${text || res.statusText}`);
  }

  return storagePath;
};

const deleteFromBunnyStorage = async (storagePath) => {
  if (!isBunnyStorageConfigured() || !storagePath) return;

  const url = `${env.bunnyStorageEndpoint.replace(/\/$/, "")}/${env.bunnyStorageZoneName}/${storagePath}`;
  await fetch(url, {
    method: "DELETE",
    headers: { AccessKey: env.bunnyStorageAccessKey },
  }).catch(() => {}); // best-effort — never block the caller on cleanup failure
};

// Bunny pull-zone Token Authentication — same scheme as utils/bunny.js's
// signBunnyPullZoneUrl, but keyed on the Storage pull zone's own signing key.
// token = base64url(sha256(securityKey + urlPath + expires))
const signStorageUrl = (storagePath, ttlSeconds = 300) => {
  if (!isSignedDeliveryConfigured() || !storagePath) return null;

  const pullZoneBase = env.bunnyStoragePullZoneUrl.replace(/\/$/, "");
  const path = `/${storagePath}`;
  const url = new URL(`${pullZoneBase}${path}`);

  if (!env.bunnyStoragePrivateAccess) return url.toString();

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = crypto
    .createHash("sha256")
    .update(`${env.bunnyStorageSigningKey}${path}${expires}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  url.searchParams.set("token", token);
  url.searchParams.set("expires", String(expires));
  return url.toString();
};

module.exports = {
  isBunnyStorageConfigured,
  isSignedDeliveryConfigured,
  uploadToBunnyStorage,
  deleteFromBunnyStorage,
  signStorageUrl,
};
