const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const openLibraryService = require('../services/openLibraryService');

// External API routes (MUST be first)
router.get('/external/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
            });
        }

        const books = await openLibraryService.searchBooks(query);
        res.status(200).json({
            success: true,
            source: 'Open Library API',
            count: books.length,
            data: books,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.get('/external/author/:authorName', async (req, res) => {
    try {
        const books = await openLibraryService.searchByAuthor(req.params.authorName);
        res.status(200).json({
            success: true,
            source: 'Open Library API',
            count: books.length,
            data: books,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Local database routes
router.get('/', bookController.getAllBooks);
router.post('/', bookController.createBook);
router.get('/search', bookController.searchBooks);
router.get('/:id', bookController.getBook);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
