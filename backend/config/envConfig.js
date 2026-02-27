/**
 * Environment Configuration Validation
 * Ensures all required environment variables are set
 */

const requiredEnvVars = {
    production: [
        "MONGODB_URI",
        "JWT_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_REGION",
        "AWS_S3_BUCKET",
    ],
    development: [
        "MONGODB_URI",
        "JWT_SECRET",
    ],
};

/**
 * Validate environment configuration
 */
const validateEnv = () => {
    const nodeEnv = process.env.NODE_ENV || "development";
    const varsToCheck = requiredEnvVars[nodeEnv] || requiredEnvVars.development;

    const missingVars = varsToCheck.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
        const message = `Missing required environment variables: ${missingVars.join(", ")}`;

        if (nodeEnv === "production") {
            throw new Error(`FATAL: ${message}`);
        } else {
            console.warn(`WARNING: ${message}`);
            console.warn("Some features may not work correctly.");
        }
    }

    // Validate JWT secret strength in production
    if (nodeEnv === "production" && process.env.JWT_SECRET) {
        if (process.env.JWT_SECRET.length < 32) {
            throw new Error(
                "FATAL: JWT_SECRET must be at least 32 characters in production"
            );
        }
    } else if (!process.env.JWT_SECRET) {
        throw new Error("FATAL: JWT_SECRET is required");
    }

    console.log(`✓ Environment validation passed (${nodeEnv})`);
};

/**
 * Get configuration based on environment
 */
const getConfig = () => ({
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000"),
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY || "15m",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    logLevel: process.env.LOG_LEVEL || "info",
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(
        ","
    ),
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || "us-east-1",
        bucket: process.env.AWS_S3_BUCKET,
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
});

module.exports = { validateEnv, getConfig };
