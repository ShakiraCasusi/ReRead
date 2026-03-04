const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const openLibraryService = require("../services/openLibraryService");
const { asyncHandler } = require("../utils/errorHandler");
const { AppError } = require("../utils/errorHandler");
const { bookValidators } = require("../middleware/validators");
const { logger } = require("../config/logger");
const tokenManager = require("../utils/tokenManager");

// Specific routes MUST come before generic /:id route
router.get("/search", bookValidators.search, bookController.searchBooks);

// External Open Library API searches
router.get(
  "/external/search",
  asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query) {
      throw new AppError("Search query is required", 400, "MISSING_QUERY");
    }

    logger.info("Searching Open Library", { query });
    const books = await openLibraryService.searchBooks(query);

    res.status(200).json({
      success: true,
      source: "Open Library API",
      count: books.length,
      data: books,
      timestamp: new Date().toISOString(),
    });
  }),
);

router.get(
  "/external/author/:authorName",
  asyncHandler(async (req, res) => {
    const { authorName } = req.params;
    if (!authorName || authorName.trim().length === 0) {
      throw new AppError("Author name is required", 400, "MISSING_AUTHOR");
    }

    logger.info("Searching author", { authorName });
    const books = await openLibraryService.searchByAuthor(authorName);

    res.status(200).json({
      success: true,
      source: "Open Library API",
      count: books.length,
      data: books,
      timestamp: new Date().toISOString(),
    });
  }),
);

// Generic routes
router.get("/", bookController.getAllBooks);
router.post(
  "/",
  tokenManager.authenticateToken,
  bookValidators.upsert,
  bookController.createBook,
);
router.get("/:id", bookValidators.checkBookId, bookController.getBook);
router.put(
  "/:id",
  tokenManager.authenticateToken,
  bookValidators.checkBookId,
  bookValidators.upsert,
  bookController.updateBook,
);
router.delete(
  "/:id",
  tokenManager.authenticateToken,
  bookValidators.checkBookId,
  bookController.deleteBook,
);

// Image proxy endpoint to serve S3 images with CORS headers
router.get(
  "/image-proxy/:encodedUrl",
  asyncHandler(async (req, res) => {
    try {
      const { encodedUrl } = req.params;

      // Decode the URL from base64
      let imageUrl;
      try {
        imageUrl = Buffer.from(encodedUrl, "base64").toString("utf-8");
      } catch (decodeError) {
        throw new AppError("Invalid encoded URL", 400, "INVALID_URL");
      }

      // Validate that it's an S3 URL
      if (!imageUrl.includes(".s3.") || !imageUrl.includes("amazonaws")) {
        throw new AppError(
          "Only S3 images are supported",
          400,
          "INVALID_SOURCE",
        );
      }

      // Fetch the image from S3
      const axios = require("axios");
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent": "ReRead/1.0",
        },
      });

      // Set proper CORS headers and cache headers
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Content-Type": imageResponse.headers["content-type"] || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      });

      res.send(imageResponse.data);
    } catch (error) {
      logger.error("Image proxy error:", error.message);
      throw new AppError("Failed to proxy image", 500, "IMAGE_PROXY_ERROR");
    }
  }),
);

module.exports = router;
