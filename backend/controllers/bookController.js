const Book = require('../models/Book');
const axios = require('axios');

const bookController = {
    // Get all books
    getAllBooks: async (req, res) => {
        try {
            const { genre, quality, featured, isNewBook } = req.query;
            let query = {};

            // Filter by genre
            if (genre && genre !== 'all') {
                query.genre = genre;
            }

            // Filter by quality
            if (quality && quality !== 'all') {
                query.quality = quality;
            }

            // Filter by featured
            if (featured === 'true') {
                query.featured = true;
            }

            // Filter by new
            if (isNewBook === 'true') {
                query.isNewBook = true;
            }

            const books = await Book.find(query).populate('sellerId', 'username email').sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                count: books.length,
                data: books,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Get single book
    getBook: async (req, res) => {
        try {
            const book = await Book.findById(req.params.id).populate('sellerId', 'username email');
            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Book not found',
                });
            }
            res.status(200).json({
                success: true,
                data: book,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Create new book
    createBook: async (req, res) => {
        try {
            const { title, author, price, condition, quality, genre, category, description, isbn, imageUrl, image, rating, featured, isNewBook, originalPrice, sellerId } = req.body;

            // Validate required fields
            if (!title || !author || !price || !sellerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: title, author, price, sellerId',
                });
            }

            // Fetch additional info from Open Library API if ISBN provided
            let openLibraryId = null;
            if (isbn) {
                try {
                    const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jio=json`);
                    const bookData = Object.values(response.data)[0];
                    if (bookData) {
                        openLibraryId = bookData.url.split('/')[4];
                    }
                } catch (apiError) {
                    console.log('Open Library API call failed, continuing without external data');
                }
            }

            const book = await Book.create({
                title,
                author,
                price,
                quality: quality || condition || 'Good',
                genre,
                category,
                description,
                isbn,
                image: image || imageUrl,
                rating,
                featured,
                isNewBook,
                originalPrice,
                openLibraryId,
                sellerId,
            });

            await book.populate('sellerId', 'username email');

            res.status(201).json({
                success: true,
                message: 'Book created successfully',
                data: book,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Update book
    updateBook: async (req, res) => {
        try {
            const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            }).populate('sellerId', 'username email');

            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Book not found',
                });
            }

            res.status(200).json({
                success: true,
                message: 'Book updated successfully',
                data: book,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Delete book
    deleteBook: async (req, res) => {
        try {
            const book = await Book.findByIdAndDelete(req.params.id);

            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Book not found',
                });
            }

            res.status(200).json({
                success: true,
                message: 'Book deleted successfully',
                data: {},
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Search books by title or author
    searchBooks: async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required',
                });
            }

            const books = await Book.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { author: { $regex: query, $options: 'i' } },
                    { genre: { $regex: query, $options: 'i' } },
                ],
            }).populate('sellerId', 'username email').sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: books.length,
                data: books,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = bookController;
