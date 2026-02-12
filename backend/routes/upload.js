// File Upload Routes
const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/fileUpload');
const { authenticateToken } = require('../utils/tokenManager');
const s3Service = require('../services/s3Service');
const path = require('path');

/**
 * POST /api/upload/book-cover
 * Upload a book cover image
 * Authentication: Required
 */
router.post(
  '/book-cover',
  authenticateToken,
  uploadSingle('image'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Validate file type
      const fileExt = path.extname(req.file.originalname);
      if (!s3Service.isFileTypeAllowed(req.file.mimetype, fileExt)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed types: ${process.env.ALLOWED_FILE_TYPES || 'jpg, jpeg, png, gif, webp'}`
        });
      }

      // Upload to S3
      const result = await s3Service.uploadToS3(
        req.file,
        'books/covers/',
        {
          'uploaded-by': req.user.id,
          'user-email': req.user.email
        }
      );

      res.status(200).json({
        success: true,
        message: 'Book cover uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Book cover upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload book cover'
      });
    }
  }
);

/**
 * POST /api/upload/profile-picture
 * Upload a user profile picture
 * Authentication: Required
 */
router.post(
  '/profile-picture',
  authenticateToken,
  uploadSingle('profilePicture'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Validate file type
      const fileExt = path.extname(req.file.originalname);
      if (!s3Service.isFileTypeAllowed(req.file.mimetype, fileExt)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed types: ${process.env.ALLOWED_FILE_TYPES || 'jpg, jpeg, png, gif, webp'}`
        });
      }

      // Upload to S3
      const result = await s3Service.uploadToS3(
        req.file,
        'users/profiles/',
        {
          'uploaded-by': req.user.id,
          'user-email': req.user.email
        }
      );

      res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload profile picture'
      });
    }
  }
);

/**
 * POST /api/upload/book-file
 * Upload a book file (PDF, EPUB, MOBI)
 * Authentication: Required (Seller only)
 */
router.post(
  '/book-file',
  authenticateToken,
  uploadSingle('bookFile'),
  handleUploadError,
  async (req, res) => {
    try {
      // Check if user is a seller
      if (!req.user.isSeller) {
        return res.status(403).json({
          success: false,
          error: 'Only sellers can upload book files'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Validate file type
      const fileExt = path.extname(req.file.originalname);
      if (!s3Service.isFileTypeAllowed(req.file.mimetype, fileExt)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed types: ${process.env.ALLOWED_FILE_TYPES || 'pdf, epub, mobi'}`
        });
      }

      // Upload to S3
      const result = await s3Service.uploadToS3(
        req.file,
        'books/files/',
        {
          'uploaded-by': req.user.id,
          'seller-id': req.user.id,
          'seller-email': req.user.email
        }
      );

      res.status(200).json({
        success: true,
        message: 'Book file uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Book file upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload book file'
      });
    }
  }
);

/**
 * DELETE /api/upload/:fileKey
 * Delete a file from S3
 * Authentication: Required
 * Authorization: User can only delete their own files
 */
router.delete(
  '/:fileKey',
  authenticateToken,
  async (req, res) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      // Decode the file key if it's URL encoded
      const decodedKey = decodeURIComponent(fileKey);

      // Note: In production, you should verify that the user owns this file
      // by checking the database record. This is a basic example.

      const result = await s3Service.deleteFromS3(decodedKey);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('File delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete file'
      });
    }
  }
);

/**
 * GET /api/upload/download/:fileKey
 * Get a signed URL for downloading a private file
 * Authentication: Required
 */
router.get(
  '/download/:fileKey',
  authenticateToken,
  async (req, res) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      // Decode the file key if it's URL encoded
      const decodedKey = decodeURIComponent(fileKey);

      // Get signed URL
      const result = await s3Service.getSignedDownloadUrl(decodedKey, 3600); // 1 hour expiry only :)

      res.status(200).json({
        success: true,
        message: 'Signed download URL generated',
        data: result
      });
    } catch (error) {
      console.error('Signed URL generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate download URL'
      });
    }
  }
);

/**
 * GET /api/upload/public-download/:fileKey
 * Get a signed URL for downloading a private file (PUBLIC - no auth required)
 * Used for digital downloads after purchase
 */
router.get(
  '/public-download/:fileKey',
  async (req, res) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      // Decode the file key if it's URL encoded
      const decodedKey = decodeURIComponent(fileKey);

      console.log(`📥 Public download request for: ${decodedKey}`);

      // Validate that the S3 service is available
      if (!s3Service || !s3Service.getSignedDownloadUrl) {
        console.error('S3 Service not available');
        return res.status(500).json({
          success: false,
          error: 'S3 service not configured'
        });
      }

      // Get signed URL (valid for 24 hours for public downloads)
      const result = await s3Service.getSignedDownloadUrl(decodedKey, 86400); // 24 hours

      console.log(`✅ Generated signed URL for: ${decodedKey}`);

      res.status(200).json({
        success: true,
        message: 'Signed download URL generated',
        data: result
      });
    } catch (error) {
      console.error('❌ Public signed URL generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate download URL'
      });
    }
  }
);

module.exports = router;
