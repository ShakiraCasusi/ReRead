/**
 * Custom Application Error Class
 * Standardizes error responses across the application
 */
class AppError extends Error {
    constructor(message, statusCode, errorType = "INTERNAL_SERVER_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Async route handler wrapper
 * Automatically catches errors and passes to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        next(err);
    });
};

/**
 * Convert various error types to AppError
 */
const normalizeError = (err) => {
    // Already an AppError
    if (err instanceof AppError) return err;

    // MongoDB validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
        return new AppError(messages, 400, "VALIDATION_ERROR");
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return new AppError(
            `${field} already exists`,
            400,
            "DUPLICATE_FIELD"
        );
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return new AppError("Invalid token", 401, "INVALID_TOKEN");
    }

    if (err.name === "TokenExpiredError") {
        return new AppError("Token expired", 401, "TOKEN_EXPIRED");
    }

    // Default to generic server error
    return new AppError(
        err.message || "Internal Server Error",
        err.statusCode || 500,
        "INTERNAL_SERVER_ERROR"
    );
};

module.exports = { AppError, asyncHandler, normalizeError };
