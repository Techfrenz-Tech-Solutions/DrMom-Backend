const { env } = require("../config/env");

const buildBunnyEmbedUrl = (lesson) => {
  if (lesson.bunnyEmbedUrl) return lesson.bunnyEmbedUrl;
  if (!lesson.bunnyVideoId || !env.bunnyLibraryId) return null;
  return `https://${env.bunnyCdnHost}/embed/${env.bunnyLibraryId}/${lesson.bunnyVideoId}`;
};

const getPlaybackPayload = (lesson) => ({
  lessonId: lesson.id,
  videoId: lesson.bunnyVideoId,
  embedUrl: buildBunnyEmbedUrl(lesson),
});

module.exports = { buildBunnyEmbedUrl, getPlaybackPayload };
