// Backend JWT Token Manager

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '15m'; // Access token expiry
const REFRESH_EXPIRY = '7d'; // Refresh token expiry

// Generate Access Token (short-lived)
exports.generateAccessToken = (userId, email, username, role, isSeller = false) => {
    return jwt.sign(
        { userId, email, username, role, isSeller },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

// Generate Refresh Token (long-lived)
exports.generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
};

// Generate both tokens
exports.generateTokens = (userId, email, username, role, isSeller = false) => {
    const accessToken = exports.generateAccessToken(userId, email, username, role, isSeller);
    const refreshToken = exports.generateRefreshToken(userId);

    return {
        accessToken,
        refreshToken,
        expiresIn: '15m'
    };
};

// Verify Token
exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Verify and Decode Token
exports.decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

// Middleware to verify JWT
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    const decoded = exports.verifyToken(token);
    if (!decoded) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }

    req.user = decoded;
    next();
};

// Middleware to verify refresh token
exports.authenticateRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token required'
        });
    }

    const decoded = exports.verifyToken(refreshToken);
    if (!decoded) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }

    req.user = decoded;
    next();
};
