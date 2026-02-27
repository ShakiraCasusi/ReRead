const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const openLibraryService = require("../services/openLibraryService");
const { asyncHandler } = require("../utils/errorHandler");
const { AppError } = require("../utils/errorHandler");
const { bookValidators } = require("../middleware/validators");
const { logger } = require("../config/logger");

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
  })
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
  })
);

// Generic routes
router.get("/", bookController.getAllBooks);
router.post("/", bookController.createBook);
router.get("/:id", bookController.getBook);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);

module.exports = router;
