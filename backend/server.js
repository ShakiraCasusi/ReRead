require("dotenv").config();


// ENVIRONMENT VALIDATION (FIRST!)

const { validateEnv, getConfig } = require("./config/envConfig");
validateEnv();
const config = getConfig();


// CORE DEPENDENCIES

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const connectDB = require("./config/database");


// LOGGING & ERROR HANDLING

const { logger, morganStream } = require("./config/logger");
const {
  globalErrorHandler,
  notFoundHandler,
  handleUnhandledRejection,
} = require("./middleware/errorHandler");


// SECURITY MIDDLEWARE

const helmetConfig = require("./config/helmetConfig");
const {
  authLimiter,
  registerLimiter,
  apiLimiter,
  uploadLimiter,
} = require("./middleware/rateLimiter");


// ROUTE IMPORTS

const bookRoutes = require("./routes/books");
const cartRoutes = require("./routes/cart");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");
const sellerRoutes = require("./routes/seller");
const uploadRoutes = require("./routes/upload");


// EXPRESS APP SETUP

const app = express();


// SECURITY HEADERS (HELMET)

app.use(helmetConfig);


// LOGGING (MORGAN)

const morganFormat = process.env.NODE_ENV === "production"
  ? "combined"
  : "dev";
app.use(morgan(morganFormat, { stream: morganStream }));


// CORS CONFIGURATION

const corsOptions = {
  origin: config.allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
};

if (config.nodeEnv === "development") {
  // Allow localhost for development
  corsOptions.origin = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    ...config.allowedOrigins,
  ];
}

app.use(cors(corsOptions));


// BODY PARSING

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// GENERAL API RATE LIMITING

app.use("/api/", apiLimiter);


// ROUTE MOUNTING


// Auth routes (limiters applied within routes)
app.use("/api/auth", authRoutes);

// Other routes
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);


// HEALTH CHECK

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});


// ERROR HANDLING MIDDLEWARE


// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);


// UNHANDLED REJECTION HANDLING

handleUnhandledRejection();


// DATABASE & SERVER START

async function start() {
  try {
    // Validate environment first
    logger.info("Starting ReRead Backend Server", { version: "1.0" });

    // Connect to MongoDB
    const conn = await connectDB();
    if (!conn) {
      throw new Error(
        "MongoDB connection failed. Check MONGODB_URI in backend/.env"
      );
    }

    // Start server
    const server = app.listen(config.port, () => {
      logger.info("Server started successfully", {
        port: config.port,
        environment: config.nodeEnv,
        corsOrigins: config.allowedOrigins,
      });
      console.log(`\n✓ ReRead Backend Server running on port ${config.port}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ MongoDB: Connected\n`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received: Shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received: Shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Server startup failed", {
      message: error.message,
      stack: error.stack,
    });
    console.error("✗ Server Error:", error.message);
    process.exit(1);
  }
}

start();
