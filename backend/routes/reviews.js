const express = require('express');
const router = express.Router();
const Review = require('../models/Phase3Models').Review;
const Book = require('../models/Book');
const Order = require('../models/Phase3Models').Order;
const tokenManager = require('../utils/tokenManager');

// Middleware to authenticate requests
const authenticateToken = tokenManager.authenticateToken;

// Create review (Phase 3 - New)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { bookId, orderId, rating, title, comment } = req.body;

        if (!bookId || !rating || !title || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Book ID, rating, title, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Verify book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Verify order exists if provided (confirm purchase)
        if (orderId) {
            const order = await Order.findById(orderId);
            if (!order || order.buyerId.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Order not found or unauthorized'
                });
            }
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({
            bookId,
            userId: req.user.userId
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this book. You can update or delete your review.',
                data: existingReview
            });
        }

        // Create review
        const review = await Review.create({
            bookId,
            userId: req.user.userId,
            orderId: orderId || null,
            rating,
            title,
            comment
        });

        // Update book's average rating
        await updateBookRating(bookId);

        await review.populate('userId', 'username profilePicture');

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            notificationType: 'REVIEW_CREATED',
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get reviews for a book
router.get('/book/:bookId', async (req, res) => {
    try {
        const { sortBy = 'recent', filterRating = null } = req.query;

        let query = { bookId: req.params.bookId };

        if (filterRating) {
            query.rating = parseInt(filterRating);
        }

        let reviews = await Review.find(query)
            .populate('userId', 'username profilePicture')
            .sort({
                ...(sortBy === 'recent' && { createdAt: -1 }),
                ...(sortBy === 'helpful' && { helpfulCount: -1 }),
                ...(sortBy === 'highest' && { rating: -1 }),
                ...(sortBy === 'lowest' && { rating: 1 })
            });

        // Calculate book statistics
        const stats = {
            totalReviews: reviews.length,
            averageRating: reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : 0,
            ratingDistribution: {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            }
        };

        res.status(200).json({
            success: true,
            data: reviews,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get review by ID
router.get('/:reviewId', async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId)
            .populate('userId', 'username profilePicture')
            .populate('bookId', 'title author');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update review (only by review author)
router.put('/:reviewId', authenticateToken, async (req, res) => {
    try {
        const { rating, title, comment } = req.body;

        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check authorization
        if (review.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews'
            });
        }

        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (title) review.title = title;
        if (comment) review.comment = comment;

        await review.save();

        // Update book's average rating
        await updateBookRating(review.bookId);

        await review.populate('userId', 'username profilePicture');

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            notificationType: 'REVIEW_UPDATED',
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete review (only by review author)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check authorization
        if (review.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        const bookId = review.bookId;
        await Review.findByIdAndDelete(req.params.reviewId);

        // Update book's average rating
        await updateBookRating(bookId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            notificationType: 'REVIEW_DELETED'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark review as helpful
router.post('/:reviewId/helpful', authenticateToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user already marked as helpful
        if (!review.helpfulUsers) {
            review.helpfulUsers = [];
        }

        const userId = req.user.userId;
        const alreadyMarked = review.helpfulUsers.includes(userId);

        if (alreadyMarked) {
            // Remove helpful mark
            review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId);
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
            // Add helpful mark
            review.helpfulUsers.push(userId);
            review.helpfulCount += 1;
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: alreadyMarked ? 'Removed helpful mark' : 'Marked as helpful',
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Helper function to update book's average rating
async function updateBookRating(bookId) {
    const reviews = await Review.find({ bookId });

    if (reviews.length === 0) {
        await Book.findByIdAndUpdate(bookId, {
            averageRating: 0,
            reviewCount: 0
        });
    } else {
        const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
        await Book.findByIdAndUpdate(bookId, {
            averageRating: parseFloat(averageRating),
            reviewCount: reviews.length
        });
    }
}

module.exports = router;
