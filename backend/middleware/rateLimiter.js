/**
 * Express-Rate-Limit Configuration
 * Protects against brute force and DoS attacks
 */
const rateLimit = require("express-rate-limit");

/**
 * Strict auth limiter - Max 5 login attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many authentication attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test",
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            errorType: "RATE_LIMIT_EXCEEDED",
            message: "Too many authentication attempts. Please try again in 15 minutes.",
            timestamp: new Date().toISOString(),
        });
    },
});

/**
 * Register limiter - Max 3 registration attempts per hour per IP
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Too many registration attempts. Please try again later.",
    skip: (req) => process.env.NODE_ENV === "test",
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            errorType: "RATE_LIMIT_EXCEEDED",
            message: "Too many registrations. Please try again in 1 hour.",
            timestamp: new Date().toISOString(),
        });
    },
});

/**
 * API general limiter - Max 100 requests per minute per IP
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: "Too many API requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Uploads limiter - Max 10 uploads per hour
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many uploads. Please try again later.",
    skip: (req) => process.env.NODE_ENV === "test",
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            errorType: "RATE_LIMIT_EXCEEDED",
            message: "Upload limit exceeded. Please try again in 1 hour.",
            timestamp: new Date().toISOString(),
        });
    },
});

/**
 * Search limiter - Max 30 searches per minute per IP
 */
const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Create order limiter - Max 5 orders per hour per IP
 */
const createOrderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Too many orders. Please try again later.",
    skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Email verification limiter - Max 3 attempts per 24 hours
 */
const emailVerificationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
    message: "Too many verification attempts. Please try again tomorrow.",
    skip: (req) => process.env.NODE_ENV === "test",
});

module.exports = {
    authLimiter,
    registerLimiter,
    apiLimiter,
    uploadLimiter,
    searchLimiter,
    createOrderLimiter,
    emailVerificationLimiter,
};
