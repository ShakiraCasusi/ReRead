/**
 * Global Error Handling Middleware
 * Catches all errors and returns standardized JSON responses
 *
 * USAGE: app.use(globalErrorHandler) - MUST be last middleware
 */
const { logger } = require("../config/logger");
const { normalizeError } = require("../utils/errorHandler");

const globalErrorHandler = (err, req, res, next) => {
    // Normalize the error
    const error = normalizeError(err);

    // Log error based on severity
    const logData = {
        errorType: error.errorType,
        message: error.message,
        status: error.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: error.timestamp,
        userId: req.user?._id,
    };

    if (error.statusCode >= 500) {
        logger.error("Server Error", {
            ...logData,
            stack: err.stack,
            originalError: err.message,
        });
    } else if (error.statusCode >= 400) {
        logger.warn("Client Error", logData);
    } else {
        logger.info("Error Response", logData);
    }

    // Build response
    const isDevelopment = process.env.NODE_ENV === "development";

    const response = {
        success: false,
        errorType: error.errorType,
        message: error.message,
        ...(isDevelopment && { stack: err.stack }),
        timestamp: error.timestamp,
    };

    // Send response
    res.status(error.statusCode).json(response);
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
    const notFoundError = new (require("../utils/errorHandler").AppError)(
        `Route ${req.method} ${req.path} not found`,
        404,
        "NOT_FOUND"
    );
    next(notFoundError);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
    process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled Rejection", {
            reason: reason?.message || String(reason),
            promise: promise.toString(),
        });
        // Don't exit on unhandled rejection - app should continue running
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
        logger.error("Uncaught Exception", {
            message: error.message,
            stack: error.stack,
        });
        // These are serious - should exit
        process.exit(1);
    });
};

module.exports = {
    globalErrorHandler,
    notFoundHandler,
    handleUnhandledRejection,
};
