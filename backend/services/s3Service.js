// S3 Service - Handle file operations with AWS S3
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_CONFIG } = require('../config/awsS3Config');
const path = require('path');

// Generate a unique filename with timestamp
const generateFileName = (originalFileName, folderPrefix) => {
  const timestamp = Date.now();
  const ext = path.extname(originalFileName);
  const nameWithoutExt = path.basename(originalFileName, ext);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `${folderPrefix}${sanitizedName}-${timestamp}${ext}`;
};

// Upload file to S3
const uploadToS3 = async (file, folderPrefix, metadata = {}) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file provided');
    }

    if (!S3_CONFIG.bucket) {
      throw new Error('S3 bucket name not configured');
    }

    const key = generateFileName(file.originalname, folderPrefix);

    const uploadParams = {
      Bucket: S3_CONFIG.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'original-filename': file.originalname,
        'upload-date': new Date().toISOString(),
        ...metadata
      }
    };

    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);

    // Construct the file URL - will be converted to signed URL when fetched from API
    const fileUrl = S3_CONFIG.bucketUrl
      ? `${S3_CONFIG.bucketUrl}/${key}`
      : `https://${S3_CONFIG.bucket}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      key,
      url: fileUrl,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  try {
    if (!key) {
      throw new Error('No file key provided');
    }

    if (!S3_CONFIG.bucket) {
      throw new Error('S3 bucket name not configured');
    }

    const deleteParams = {
      Bucket: S3_CONFIG.bucket,
      Key: key
    };

    const command = new DeleteObjectCommand(deleteParams);
    const result = await s3Client.send(command);

    return {
      success: true,
      message: `File ${key} deleted successfully`,
      deletedAt: new Date()
    };
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Get signed URL for private file access (valid for 1 hour by default)
const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    if (!key) {
      throw new Error('No file key provided');
    }

    if (!S3_CONFIG.bucket) {
      throw new Error('S3 bucket name not configured');
    }

    const getObjectParams = {
      Bucket: S3_CONFIG.bucket,
      Key: key
    };

    const command = new GetObjectCommand(getObjectParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      success: true,
      url: signedUrl,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
  } catch (error) {
    console.error('S3 Signed URL Error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

// Validate file type
const isFileTypeAllowed = (mimetype, fileExt) => {
  const ext = fileExt.toLowerCase().replace(/^\./, '');
  return S3_CONFIG.allowedFileTypes.includes(ext);
};

// Validate file size
const isFileSizeValid = (fileSize) => {
  return fileSize <= S3_CONFIG.maxFileSize;
};

// Identify file category
const getFileCategory = (fileExt) => {
  const ext = fileExt.toLowerCase().replace(/^\./, '');

  if (S3_CONFIG.imageTypes.includes(ext)) {
    return 'image';
  }
  if (S3_CONFIG.documentTypes.includes(ext)) {
    return 'document';
  }

  return 'unknown';
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  isFileTypeAllowed,
  isFileSizeValid,
  getFileCategory,
  generateFileName
};
