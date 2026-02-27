/**
 * Express-Validator Input Validation
 * Validates and sanitizes all user inputs
 *
 * USAGE:
 *   router.post('/register', authValidators.register, authController.register);
 */
const { body, query, param, validationResult } = require("express-validator");

/**
 * Custom error formatter for consistent validation responses
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errorType: "VALIDATION_ERROR",
            message: "Validation failed",
            errors: errors.array().map((err) => ({
                field: err.param,
                value: err.value,
                message: err.msg,
            })),
            timestamp: new Date().toISOString(),
        });
    }
    next();
};

/**
 * Authentication Validators
 */
const authValidators = {
    // Register endpoint validation
    register: [
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("Please provide a valid email address"),
        body("username")
            .trim()
            .isLength({ min: 3, max: 20 })
            .matches(/^[a-zA-Z0-9_-]+$/)
            .withMessage(
                "Username must be 3-20 characters, alphanumeric, underscore, or hyphen only"
            ),
        body("password")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters")
            .matches(/^(?=.*[a-z])/)
            .withMessage("Password must contain at least one lowercase letter")
            .matches(/^(?=.*[A-Z])/)
            .withMessage("Password must contain at least one uppercase letter")
            .matches(/^(?=.*\d)/)
            .withMessage("Password must contain at least one number")
            .matches(/^(?=.*[@$!%*?&])/)
            .withMessage(
                "Password must contain at least one special character (@$!%*?&)"
            ),
        body("firstName").optional().trim().isLength({ max: 50 }),
        body("lastName").optional().trim().isLength({ max: 50 }),
        handleValidationErrors,
    ],

    // Login endpoint validation
    login: [
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("Please provide a valid email address"),
        body("password")
            .notEmpty()
            .withMessage("Password is required"),
        handleValidationErrors,
    ],

    // Profile update validation
    updateProfile: [
        body("firstName").optional().trim().isLength({ max: 50 }),
        body("lastName").optional().trim().isLength({ max: 50 }),
        body("email")
            .optional()
            .isEmail()
            .normalizeEmail(),
        body("bio")
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage("Bio cannot exceed 500 characters"),
        handleValidationErrors,
    ],

    // Change password validation
    changePassword: [
        body("currentPassword")
            .notEmpty()
            .withMessage("Current password is required"),
        body("newPassword")
            .isLength({ min: 8 })
            .withMessage("New password must be at least 8 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
            .withMessage(
                "Password must contain uppercase, lowercase, number, and special character"
            ),
        handleValidationErrors,
    ],
};

/**
 * Book Validators
 */
const bookValidators = {
    // Create/Update book validation
    upsert: [
        body("title")
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage("Title must be 1-200 characters"),
        body("author")
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage("Author cannot exceed 100 characters"),
        body("description")
            .optional()
            .trim()
            .isLength({ max: 2000 })
            .withMessage("Description cannot exceed 2000 characters"),
        body("price")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("Price must be a positive number"),
        body("isbn")
            .optional()
            .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[-0-9 ]{10,}$|(?:(?=(?:[0-9]+[- ]){3})[- 0-9]{13}$)|(?:97[89][0-9]{10}$)|(?:(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:(?<=^(?:ISBN(?:-1[03])?:? )?)97[89][- ]?|[- ]?(?!997[89]))[0-9]{2,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9]$)/)
            .withMessage("Invalid ISBN format"),
        body("genre")
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage("Genre cannot exceed 50 characters"),
        body("publishedYear")
            .optional()
            .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
            .withMessage("Published year must be valid"),
        handleValidationErrors,
    ],

    // Search query validation
    search: [
        query("q")
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage("Search query cannot exceed 200 characters"),
        query("genre")
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage("Genre filter cannot exceed 50 characters"),
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page must be a positive integer"),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100"),
        handleValidationErrors,
    ],

    // Book ID validation
    checkBookId: [
        param("id")
            .isMongoId()
            .withMessage("Invalid book ID"),
        handleValidationErrors,
    ],
};

/**
 * Cart Validators
 */
const cartValidators = {
    addItem: [
        body("bookId")
            .notEmpty()
            .isMongoId()
            .withMessage("Valid book ID is required"),
        body("quantity")
            .optional()
            .isInt({ min: 1, max: 999 })
            .withMessage("Quantity must be between 1 and 999"),
        handleValidationErrors,
    ],

    updateItem: [
        body("quantity")
            .isInt({ min: 1, max: 999 })
            .withMessage("Quantity must be between 1 and 999"),
        handleValidationErrors,
    ],
};

/**
 * Order Validators
 */
const orderValidators = {
    create: [
        body("shippingAddress.street")
            .notEmpty()
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage("Valid street address required"),
        body("shippingAddress.city")
            .notEmpty()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage("Valid city required"),
        body("shippingAddress.zipCode")
            .notEmpty()
            .matches(/^[0-9]{4,10}$/)
            .withMessage("Valid zip code required"),
        body("shippingAddress.phone")
            .notEmpty()
            .matches(/^[0-9\s\-\+]{10,}$/)
            .withMessage("Valid phone number required"),
        handleValidationErrors,
    ],
};

/**
 * Review Validators
 */
const reviewValidators = {
    create: [
        body("rating")
            .isInt({ min: 1, max: 5 })
            .withMessage("Rating must be between 1 and 5"),
        body("comment")
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage("Comment cannot exceed 1000 characters"),
        handleValidationErrors,
    ],
};

/**
 * File Upload Validators
 */
const fileValidators = {
    upload: [
        body("title")
            .optional()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage("Title must be 1-200 characters"),
        handleValidationErrors,
    ],
};

module.exports = {
    handleValidationErrors,
    authValidators,
    bookValidators,
    cartValidators,
    orderValidators,
    reviewValidators,
    fileValidators,
};
