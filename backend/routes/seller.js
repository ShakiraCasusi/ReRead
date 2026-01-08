const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const tokenManager = require('../utils/tokenManager');

// Middleware to authenticate requests
const authenticateToken = tokenManager.authenticateToken;

// Become a seller (Phase 3 - Already in auth controller, but can also be here)
router.post('/register', authenticateToken, async (req, res) => {
    try {
        const { storeName, description, bankAccount } = req.body;

        if (!storeName || !description) {
            return res.status(400).json({
                success: false,
                message: 'Store name and description are required'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                isSeller: true,
                role: ['buyer', 'seller'],
                sellerInfo: {
                    storeName,
                    description,
                    bankAccount: bankAccount || '', // Encrypt in production
                    rating: 5.0,
                    totalSales: 0,
                    createdAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Welcome to ReRead Seller Program!',
            notificationType: 'SUCCESS_SELLER_SIGNUP',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Upload/create new book listing (seller only)
router.post('/books', authenticateToken, async (req, res) => {
    try {
        const { title, author, isbn, description, genre, condition, price, coverImage } = req.body;

        // Verify seller
        const user = await User.findById(req.user.userId);
        if (!user.isSeller) {
            return res.status(403).json({
                success: false,
                message: 'You must be a seller to upload books'
            });
        }

        // Validate required fields
        if (!title || !author || !price || !condition) {
            return res.status(400).json({
                success: false,
                message: 'Title, author, price, and condition are required'
            });
        }

        // Check price
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }

        // Check if ISBN already exists (if provided)
        if (isbn) {
            const existingBook = await Book.findOne({
                isbn,
                sellerId: req.user.userId
            });
            if (existingBook) {
                return res.status(409).json({
                    success: false,
                    message: 'You have already listed this book'
                });
            }
        }

        // Create new book
        const book = await Book.create({
            title,
            author,
            isbn: isbn || null,
            description: description || '',
            genre: genre || 'Other',
            quality: condition,
            price,
            coverImage: coverImage || 'https://via.placeholder.com/150x220?text=' + encodeURIComponent(title.substring(0, 20)),
            sellerId: req.user.userId,
            sellerName: user.username,
            averageRating: 0,
            reviewCount: 0,
            inStock: true,
            createdAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Book listing created successfully',
            notificationType: 'BOOK_CREATED',
            data: book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get seller's books
router.get('/books', authenticateToken, async (req, res) => {
    try {
        const books = await Book.find({ sellerId: req.user.userId })
            .sort({ createdAt: -1 });

        const stats = {
            totalListings: books.length,
            totalPrice: books.reduce((sum, b) => sum + b.price, 0),
            averagePrice: books.length > 0
                ? (books.reduce((sum, b) => sum + b.price, 0) / books.length).toFixed(2)
                : 0
        };

        res.status(200).json({
            success: true,
            data: books,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get specific book listing (seller can edit their own)
router.get('/books/:bookId', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check authorization
        if (book.sellerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own book listings'
            });
        }

        res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update book listing (seller only)
router.put('/books/:bookId', authenticateToken, async (req, res) => {
    try {
        const { title, author, description, genre, condition, price, coverImage, inStock } = req.body;

        const book = await Book.findById(req.params.bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check authorization
        if (book.sellerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own book listings'
            });
        }

        // Update fields
        if (title) book.title = title;
        if (author) book.author = author;
        if (description) book.description = description;
        if (genre) book.genre = genre;
        if (condition) book.quality = condition;
        if (price) {
            if (isNaN(price) || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a positive number'
                });
            }
            book.price = price;
        }
        if (coverImage) book.coverImage = coverImage;
        if (inStock !== undefined) book.inStock = inStock;

        await book.save();

        res.status(200).json({
            success: true,
            message: 'Book listing updated',
            notificationType: 'BOOK_UPDATED',
            data: book
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete book listing (seller only)
router.delete('/books/:bookId', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check authorization
        if (book.sellerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own book listings'
            });
        }

        await Book.findByIdAndDelete(req.params.bookId);

        res.status(200).json({
            success: true,
            message: 'Book listing deleted',
            notificationType: 'BOOK_DELETED'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get seller's profile with stats
router.get('/profile/:sellerId', async (req, res) => {
    try {
        const seller = await User.findById(req.params.sellerId).select('-password');

        if (!seller || !seller.isSeller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        // Get seller's books
        const books = await Book.find({ sellerId: req.params.sellerId });

        // Calculate average rating
        const avgRating = books.length > 0
            ? (books.reduce((sum, b) => sum + (b.averageRating || 0), 0) / books.length).toFixed(1)
            : 0;

        const sellerData = {
            ...seller.toObject(),
            stats: {
                totalListings: books.length,
                averageRating: parseFloat(avgRating),
                totalReviews: books.reduce((sum, b) => sum + (b.reviewCount || 0), 0),
                storeName: seller.sellerInfo?.storeName || seller.username,
                description: seller.sellerInfo?.description || '',
                totalSales: seller.sellerInfo?.totalSales || 0
            }
        };

        res.status(200).json({
            success: true,
            data: sellerData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all sellers
router.get('/', async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true }).select('-password');

        const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
            const books = await Book.find({ sellerId: seller._id });
            const avgRating = books.length > 0
                ? (books.reduce((sum, b) => sum + (b.averageRating || 0), 0) / books.length).toFixed(1)
                : 0;

            return {
                ...seller.toObject(),
                stats: {
                    totalListings: books.length,
                    averageRating: parseFloat(avgRating),
                    totalReviews: books.reduce((sum, b) => sum + (b.reviewCount || 0), 0),
                    storeName: seller.sellerInfo?.storeName || seller.username
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: sellersWithStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
