// backend/middleware/fileScan.js
const { AppError } = require("../utils/errorHandler");

// EICAR standard antivirus test file string
// https://www.eicar.org/download-anti-malware-testfile/
const EICAR_STRING =
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

/**
 * Middleware to scan file content for malicious patterns.
 */
const scanFileForMaliciousContent = (req, res, next) => {
  // This middleware handles single file uploads.
  if (!req.file) {
    // No file to scan, proceed.
    return next();
  }

  const fileBuffer = req.file.buffer;
  const fileContent = fileBuffer.toString("utf8");

  if (fileContent.includes(EICAR_STRING)) {
    // Malicious content detected. Block the upload.
    const error = new AppError(
      "Malicious content detected. Upload rejected for security reasons.",
      403, // Forbidden
      "MALICIOUS_CONTENT_DETECTED",
    );
    return next(error);
  }


  next();
};

module.exports = { scanFileForMaliciousContent };
