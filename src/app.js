const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const apiRoutes = require("./routes");
const { env } = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middlewares/error");

const app = express();

// Trust only the Nginx reverse proxy running on loopback.
// Do NOT trust arbitrary X-Forwarded-For headers from the internet.
app.set("trust proxy", "loopback");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin blocked"));
    },
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "drmombackend",
    docs: "/api/health",
  });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
