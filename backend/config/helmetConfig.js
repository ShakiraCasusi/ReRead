/**
 * Helmet.js Configuration
 * Adds HTTP headers for better security
 */
const helmet = require("helmet");

/**
 * Comprehensive Helmet.js setup
 * Protects against:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - Injection attacks via CSP
 */
const helmetConfig = helmet({
    // Content Security Policy - prevents inline scripts and external resource injection
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // NOTE: Consider removing in production
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://accounts.google.com",
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
            ],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: [
                "'self'",
                "https://accounts.google.com",
                "https://api.github.com",
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },

    // Prevent clickjacking attacks
    frameguard: {
        action: "deny",
    },

    // Prevent MIME type sniffing
    noSniff: true,

    // Enable XSS protection
    xssFilter: true,

    // Referrer policy
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
    },

    // Permissions policy
    permissionsPolicy: {
        features: {
            geolocation: ["'none'"],
            microphone: ["'none'"],
            camera: ["'none'"],
        },
    },

    // Strict Transport Security (HSTS)
    // Requires HTTPS only - adjust based on environment
    hsts: process.env.NODE_ENV === "production" ? {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    } : false,

    // Expect CT (Certificate Transparency)
    expectCt: {
        enforce: true,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // Feature Policy (Deprecated but can add here)
    // Handled by permissionsPolicy instead
});

module.exports = helmetConfig;
