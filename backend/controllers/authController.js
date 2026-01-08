const User = require('../models/User');
const bcrypt = require('bcryptjs');
const tokenManager = require('../utils/tokenManager');

// Validation function for password strength
const validatePassword = (password) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!hasUppercase) {
        return { valid: false, message: 'Password must contain uppercase letter' };
    }
    if (!hasLowercase) {
        return { valid: false, message: 'Password must contain lowercase letter' };
    }
    if (!hasNumber) {
        return { valid: false, message: 'Password must contain number' };
    }
    if (!hasSymbol) {
        return { valid: false, message: 'Password must contain symbol (!@#$%^&*)' };
    }

    return { valid: true };
};

// Validation function for email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Register user (Phase 3 - Enhanced)
exports.register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                errorType: 'VALIDATION_ERROR',
                message: 'Username, email, and password are required',
                missingFields: {
                    username: !username,
                    email: !email,
                    password: !password
                }
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                errorType: 'INVALID_EMAIL',
                message: 'Please enter a valid email address'
            });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                errorType: 'WEAK_PASSWORD',
                message: passwordValidation.message
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                errorType: 'EMAIL_EXISTS',
                message: 'This email is already registered. Please sign in instead.',
                suggestion: 'signin'
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                errorType: 'USERNAME_EXISTS',
                message: 'This username is already taken. Please choose another.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName: firstName || '',
            lastName: lastName || '',
            role: ['buyer'],
            isSeller: false
        });

        // Generate tokens
        const { accessToken, refreshToken, expiresIn } = tokenManager.generateTokens(
            user._id,
            user.email,
            user.username,
            user.role
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to ReRead.',
            notificationType: 'SUCCESS_SIGNUP',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                accessToken,
                refreshToken,
                expiresIn
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            errorType: 'SERVER_ERROR',
            message: 'Error creating account. Please try again.'
        });
    }
};

// Login user (Phase 3 - Enhanced with JWT)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                errorType: 'VALIDATION_ERROR',
                message: 'Email and password are required'
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                errorType: 'INVALID_EMAIL',
                message: 'Please enter a valid email address'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                errorType: 'USER_NOT_FOUND',
                message: 'This email is not registered. Please sign up first.',
                suggestion: 'signup'
            });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                errorType: 'INVALID_PASSWORD',
                message: 'Incorrect password. Please try again.',
                suggestion: 'forgot_password'
            });
        }

        // Generate JWT tokens
        const { accessToken, refreshToken, expiresIn } = tokenManager.generateTokens(
            user._id,
            user.email,
            user.username,
            user.role
        );

        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.firstName || user.username}!`,
            notificationType: 'SUCCESS_LOGIN',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isSeller: user.isSeller,
                accessToken,
                refreshToken,
                expiresIn
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            errorType: 'SERVER_ERROR',
            message: 'Error logging in. Please try again.'
        });
    }
};

// Refresh token (Phase 3 - New)
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                errorType: 'NO_REFRESH_TOKEN',
                message: 'Refresh token required'
            });
        }

        const decoded = tokenManager.verifyToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({
                success: false,
                errorType: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token. Please login again.'
            });
        }

        // Get user details
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                errorType: 'USER_NOT_FOUND',
                message: 'User not found'
            });
        }

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = tokenManager.generateTokens(
            user._id,
            user.email,
            user.username,
            user.role
        );

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            errorType: 'SERVER_ERROR',
            message: 'Error refreshing token'
        });
    }
};

// Get current user profile (Phase 3 - JWT protected)
exports.getCurrentProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                errorType: 'USER_NOT_FOUND',
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            errorType: 'SERVER_ERROR',
            message: error.message
        });
    }
};

// Update user profile (Phase 3 - JWT protected)
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, address, phone, profilePicture } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                firstName,
                lastName,
                address,
                phone,
                profilePicture,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            notificationType: 'SUCCESS_PROFILE_UPDATE',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            errorType: 'UPDATE_ERROR',
            message: error.message
        });
    }
};

// Logout (Phase 3 - New)
exports.logout = async (req, res) => {
    try {
        // Token is simply discarded on client side
        // In production, you could blacklist tokens in Redis

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
            notificationType: 'SUCCESS_LOGOUT'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging out'
        });
    }
};

// Become a seller (Phase 3 - New)
exports.becomeSeller = async (req, res) => {
    try {
        const { storeName, description, bankAccount } = req.body;

        if (!storeName || !description) {
            return res.status(400).json({
                success: false,
                message: 'Store name and description are required'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                isSeller: true,
                role: ['buyer', 'seller'],
                sellerInfo: {
                    storeName,
                    description,
                    bankAccount: bankAccount || '', // Would be encrypted in production
                    rating: 5.0,
                    totalSales: 0
                }
            },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Welcome to ReRead Seller Program!',
            notificationType: 'SUCCESS_SELLER_SIGNUP',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
