const crypto = require("crypto");
const { env } = require("../config/env");

// Bunny Stream token auth: SHA256(tokenAuthKey + videoId + expires) → hex
// Docs: https://support.bunny.net/hc/en-us/articles/8665115513500
const signBunnyUrl = (videoId, baseUrl) => {
  if (!env.bunnyTokenAuthKey) return baseUrl;

  const expires = Math.floor(Date.now() / 1000) + 3600; // 1-hour window
  const token = crypto
    .createHash("sha256")
    .update(`${env.bunnyTokenAuthKey}${videoId}${expires}`)
    .digest("hex");

  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}token=${token}&expires=${expires}`;
};

const buildBunnyEmbedUrl = (lesson) => {
  const raw = lesson.bunnyEmbedUrl
    || (lesson.bunnyVideoId && env.bunnyLibraryId
        ? `https://${env.bunnyCdnHost}/embed/${env.bunnyLibraryId}/${lesson.bunnyVideoId}`
        : null);

  if (!raw) return null;
  return signBunnyUrl(lesson.bunnyVideoId, raw);
};

const getPlaybackPayload = (lesson) => ({
  lessonId: lesson.id,
  videoId: lesson.bunnyVideoId,
  embedUrl: buildBunnyEmbedUrl(lesson),
});

module.exports = { buildBunnyEmbedUrl, getPlaybackPayload };
