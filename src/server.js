const { app } = require("./app");
const { prisma } = require("./lib/prisma");
const { env } = require("./config/env");

const start = async () => {
  await prisma.$connect();

  app.listen(env.port, () => {
    console.log(`drmombackend listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
