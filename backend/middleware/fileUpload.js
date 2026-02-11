// File Upload Middleware
const multer = require('multer');
const path = require('path');
const { S3_CONFIG } = require('../config/awsS3Config');

// Configure storage (memory storage for S3 upload)
const storage = multer.memoryStorage();

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const allowedTypes = S3_CONFIG.allowedFileTypes;

  if (!allowedTypes.includes(ext)) {
    const error = new Error(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    );
    error.statusCode = 400;
    return cb(error);
  }

  cb(null, true);
};

// Upload middleware
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: S3_CONFIG.maxFileSize
  }
});

// Error handling wrapper for storage
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${S3_CONFIG.maxFileSize / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
  }

  if (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.message
    });
  }

  next();
};

module.exports = {
  uploadMiddleware,
  handleUploadError,
  // Export specific upload handlers for different routes
  uploadSingle: (fieldName) => uploadMiddleware.single(fieldName),
  uploadMultiple: (fieldName, maxCount = 5) => uploadMiddleware.array(fieldName, maxCount)
};
