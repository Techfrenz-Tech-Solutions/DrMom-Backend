const crypto = require("crypto");
const { env } = require("../config/env");
const { asyncHandler, AppError } = require("../utils/http");

// Bunny TUS auth: SHA256(libraryId + apiKey + expiry + videoId) → hex
const makeTusSignature = (videoId, expiry) =>
  crypto
    .createHash("sha256")
    .update(`${env.bunnyLibraryId}${env.bunnyApiKey}${expiry}${videoId}`)
    .digest("hex");

// Step 1 — Create a video entry in Bunny, return TUS upload credentials.
// The file never touches our server; the browser uploads directly to Bunny.
const initUpload = asyncHandler(async (req, res) => {
  if (!env.bunnyApiKey || !env.bunnyLibraryId) {
    throw new AppError(503, "Bunny CDN is not configured on this server");
  }

  const title = (req.body?.title || "Untitled Lesson").trim();

  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${env.bunnyLibraryId}/videos`,
    {
      method: "POST",
      headers: { AccessKey: env.bunnyApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    },
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new AppError(502, `Bunny rejected video creation: ${err}`);
  }

  const { guid } = await createRes.json();
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1-hour upload window

  res.json({
    success: true,
    videoGuid: guid,
    tusEndpoint: "https://video.bunnycdn.com/tusupload",
    authSignature: makeTusSignature(guid, expiry),
    authExpire: expiry,
    libraryId: env.bunnyLibraryId,
    embedUrl: `https://${env.bunnyCdnHost}/embed/${env.bunnyLibraryId}/${guid}`,
    thumbnailUrl: env.bunnyPullZone
      ? `https://${env.bunnyPullZone}.b-cdn.net/${guid}/thumbnail.jpg`
      : "",
  });
});

// Step 2 — Poll encoding status after upload completes.
const getVideoStatus = asyncHandler(async (req, res) => {
  if (!env.bunnyApiKey || !env.bunnyLibraryId) {
    throw new AppError(503, "Bunny CDN is not configured");
  }

  const r = await fetch(
    `https://video.bunnycdn.com/library/${env.bunnyLibraryId}/videos/${req.params.guid}`,
    { headers: { AccessKey: env.bunnyApiKey } },
  );

  if (!r.ok) throw new AppError(404, "Video not found in Bunny CDN");

  const data = await r.json();
  // 0=Created 1=Uploading 2=Processing 3=Transcoding 4=Finished 5=Error 6=UploadFailed
  const labels = ["Created", "Uploading", "Processing", "Transcoding", "Ready", "Error", "Upload Failed"];

  res.json({
    success: true,
    guid: data.guid,
    title: data.title,
    status: data.status,
    statusLabel: labels[data.status] ?? "Unknown",
    ready: data.status === 4,
    duration: data.length,
  });
});

module.exports = { initUpload, getVideoStatus };
