const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const tokenManager = require('../utils/tokenManager');
const { getSignedDownloadUrl, deleteFromS3 } = require('../services/s3Service');

// Middleware to authenticate requests
const authenticateToken = tokenManager.authenticateToken;

// Helper to generate signed URLs for S3 book images
async function normalizeBookImages(book) {
    try {
        const bookObj = book.toObject ? book.toObject() : book;

        if (bookObj.image && bookObj.image.url && typeof bookObj.image.url === 'string') {
            const imageUrl = bookObj.image.url;

            // Check if this is an S3 URL that needs a signed version
            if (imageUrl.includes('.s3.') && !imageUrl.includes('?X-Amz-Signature')) {
                try {
                    const urlParts = imageUrl.split('.amazonaws.com/');
                    if (urlParts.length === 2) {
                        const s3Key = decodeURIComponent(urlParts[1]);
                        const signedUrlResult = await getSignedDownloadUrl(s3Key, 3600);
                        if (signedUrlResult.success) {
                            bookObj.image.url = signedUrlResult.url;
                        }
                    }
                } catch (err) {
                    console.warn('Could not generate signed URL:', err.message);
                }
            }
        }

        // Handle multiple images array - generate signed URLs for each image
        if (bookObj.images && Array.isArray(bookObj.images)) {
            bookObj.images = await Promise.all(bookObj.images.map(async (imageObj) => {
                if (!imageObj) return imageObj;

                let imageUrl = null;
                if (typeof imageObj === 'object' && imageObj.url) {
                    imageUrl = imageObj.url;
                } else if (typeof imageObj === 'string') {
                    imageUrl = imageObj;
                }

                // Generate signed URL if S3 image
                if (imageUrl && imageUrl.includes('.s3.') && !imageUrl.includes('?X-Amz-Signature')) {
                    try {
                        const urlParts = imageUrl.split('.amazonaws.com/');
                        if (urlParts.length === 2) {
                            const s3Key = decodeURIComponent(urlParts[1]);
                            const signedUrlResult = await getSignedDownloadUrl(s3Key, 3600);
                            if (signedUrlResult.success) {
                                if (typeof imageObj === 'object') {
                                    return { ...imageObj, url: signedUrlResult.url };
                                } else {
                                    return { url: signedUrlResult.url };
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('Could not generate signed URL for images array:', err.message);
                    }
                }

                return imageObj;
            }));
        }

        return bookObj;
    } catch (error) {
        console.error('Error normalizing book:', error);
        return book;
    }
}

// Become a seller (Already in auth controller)
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
        const { title, author, isbn, description, genre, condition, price, coverImage, image, images, documentUrl } = req.body;

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

        // Handle image - support both old coverImage and new image formats
        let bookImage;
        const imageUrl = image || coverImage;
        if (imageUrl) {
            if (typeof imageUrl === 'object' && imageUrl.url) {
                // S3 upload format: { url, key, uploadedAt }
                bookImage = imageUrl;
            } else if (typeof imageUrl === 'string') {
                // Legacy URL string
                bookImage = {
                    url: imageUrl,
                    uploadedAt: new Date()
                };
            }
        } else if (images && Array.isArray(images) && images.length > 0) {
            // Use first image from images array as cover if no primary image provided
            const firstImage = images[0];
            if (typeof firstImage === 'object' && firstImage.url) {
                bookImage = firstImage;
            } else if (typeof firstImage === 'string') {
                bookImage = {
                    url: firstImage,
                    uploadedAt: new Date()
                };
            }
        }

        // Build book object - only include ISBN if provided
        const bookData = {
            title,
            author,
            description: description || '',
            genre: genre || 'Other',
            quality: condition,
            price,
            image: bookImage || {
                url: 'https://via.placeholder.com/150x220?text=' + encodeURIComponent(title.substring(0, 20)),
                uploadedAt: new Date()
            },
            sellerId: req.user.userId,
            sellerName: user.username,
            averageRating: 0,
            reviewCount: 0,
            createdAt: new Date()
        };

        // Only add ISBN if it's provided and not empty
        if (isbn && isbn.trim()) {
            bookData.isbn = isbn.trim();
        }

        // Only add images if they're provided and not empty
        if (images && Array.isArray(images) && images.length > 0) {
            bookData.images = images;
        }

        // Only add documentUrl if provided - store in bookFile field
        if (documentUrl) {
            if (typeof documentUrl === 'object' && documentUrl.url) {
                // S3 upload format: { url, key, fileType, uploadedAt }
                bookData.bookFile = documentUrl;
            } else if (typeof documentUrl === 'string') {
                // Legacy URL string
                bookData.bookFile = {
                    url: documentUrl,
                    uploadedAt: new Date()
                };
            }
        }

        // Create new book
        const book = await Book.create(bookData);

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
        console.log('Fetching books for user:', req.user.userId);

        let books = await Book.find({ sellerId: req.user.userId })
            .sort({ createdAt: -1 });

        // Normalize image field and generate signed URLs
        books = await Promise.all(books.map(async (book) => {
            const bookObj = book.toObject();

            // If image is a string (old format), convert to new object format
            if (typeof bookObj.image === 'string') {
                bookObj.image = {
                    url: bookObj.image,
                    uploadedAt: book.createdAt || new Date()
                };
            }

            // Generate signed URL if S3 image
            return await normalizeBookImages(bookObj);
        }));

        console.log('Found', books.length, 'books');

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
        console.error('Error fetching seller books:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString()
        });
    }
});

// Get specific book listing (seller can edit their own)
router.get('/books/:bookId', authenticateToken, async (req, res) => {
    try {
        let book = await Book.findById(req.params.bookId);

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

        // Normalize image field and generate signed URLs
        let bookObj = book.toObject();
        if (typeof bookObj.image === 'string') {
            bookObj.image = {
                url: bookObj.image,
                uploadedAt: book.createdAt || new Date()
            };
        }
        bookObj = await normalizeBookImages(bookObj);

        res.status(200).json({
            success: true,
            data: bookObj
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
        const { title, author, description, genre, condition, price, coverImage, image, images, documentUrl } = req.body;

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

        // Handle image update - support both old coverImage and new image formats
        if (coverImage !== undefined || image !== undefined) {
            const imageUrl = image || coverImage;
            if (imageUrl) {
                if (typeof imageUrl === 'object' && imageUrl.url) {
                    // S3 upload format: { url, key, uploadedAt }
                    book.image = imageUrl;
                } else if (typeof imageUrl === 'string') {
                    // Legacy URL string
                    book.image = {
                        url: imageUrl,
                        uploadedAt: new Date()
                    };
                }
            }
        }

        // Handle multiple images update
        if (images !== undefined && Array.isArray(images) && images.length > 0) {
            book.images = images;
        }

        // Handle documentUrl update
        if (documentUrl !== undefined) {
            if (documentUrl !== null) {
                if (typeof documentUrl === 'object' && documentUrl.url) {
                    // S3 upload format: { url, key, fileType, uploadedAt }
                    book.bookFile = documentUrl;
                } else if (typeof documentUrl === 'string') {
                    // Legacy URL string
                    book.bookFile = {
                        url: documentUrl,
                        uploadedAt: new Date()
                    };
                }
            } else {
                // null means delete the file reference
                book.bookFile = undefined;
            }
        }

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

        // Delete associated S3 files before deleting the book record
        const filesToDelete = [];

        // Add single image file if it exists
        if (book.image) {
            let imageUrl = null;
            if (typeof book.image === 'object' && book.image.url) {
                imageUrl = book.image.url;
            } else if (typeof book.image === 'string') {
                imageUrl = book.image;
            }
            if (imageUrl && imageUrl.includes('.s3.')) {
                // Extract S3 key from URL
                try {
                    const urlParts = imageUrl.split('.amazonaws.com/');
                    if (urlParts.length === 2) {
                        filesToDelete.push(decodeURIComponent(urlParts[1]));
                    }
                } catch (e) {
                    console.warn('Could not extract S3 key from image URL:', e.message);
                }
            }
        }

        // Add multiple images files if they exist
        if (book.images && Array.isArray(book.images)) {
            book.images.forEach(imageObj => {
                let imageUrl = null;
                if (typeof imageObj === 'object' && imageObj.url) {
                    imageUrl = imageObj.url;
                } else if (typeof imageObj === 'string') {
                    imageUrl = imageObj;
                }
                if (imageUrl && imageUrl.includes('.s3.')) {
                    try {
                        const urlParts = imageUrl.split('.amazonaws.com/');
                        if (urlParts.length === 2) {
                            filesToDelete.push(decodeURIComponent(urlParts[1]));
                        }
                    } catch (e) {
                        console.warn('Could not extract S3 key from images URL:', e.message);
                    }
                }
            });
        }

        // Add book file if it exists
        if (book.bookFile) {
            let fileUrl = null;
            if (typeof book.bookFile === 'object' && book.bookFile.url) {
                fileUrl = book.bookFile.url;
            } else if (typeof book.bookFile === 'string') {
                fileUrl = book.bookFile;
            }
            if (fileUrl && fileUrl.includes('.s3.')) {
                // Extract S3 key from URL
                try {
                    const urlParts = fileUrl.split('.amazonaws.com/');
                    if (urlParts.length === 2) {
                        filesToDelete.push(decodeURIComponent(urlParts[1]));
                    }
                } catch (e) {
                    console.warn('Could not extract S3 key from bookFile URL:', e.message);
                }
            }
        }

        // Delete all files from S3
        for (const key of filesToDelete) {
            try {
                await deleteFromS3(key);
                console.log('Deleted S3 file:', key);
            } catch (deleteError) {
                console.error('Error deleting S3 file:', key, deleteError.message);
                // Continue deleting other files even if one fails
            }
        }

        // Delete the book from database
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
