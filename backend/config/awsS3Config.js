// AWS S3 Configuration :)
const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET_NAME,
  bucketUrl: process.env.AWS_S3_BUCKET_URL,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp,pdf,epub,mobi').split(','),

  // File type categories (Pa-edit na lang if needed)
  imageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  documentTypes: ['pdf', 'epub', 'mobi'],

  // S3 folder prefixes
  folderPrefixes: {
    bookCovers: 'books/covers/',
    profilePictures: 'users/profiles/',
    bookFiles: 'books/files/',
    reviews: 'reviews/'
  }
};

// Validate required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️  AWS credentials not configured. File uploads will not work.');
  console.warn('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
}

if (!process.env.AWS_S3_BUCKET_NAME) {
  console.warn('⚠️  AWS_S3_BUCKET_NAME not configured. File uploads will not work.');
}

module.exports = { s3Client, S3_CONFIG };
