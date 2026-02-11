const Book = require('../models/Book');
const axios = require('axios');
const { getSignedDownloadUrl } = require('../services/s3Service');

// Helper function to normalize book image field and generate signed URLs if needed
async function normalizeBook(book) {
    try {
        const bookObj = book.toObject ? book.toObject() : book;

        // If image is a string, convert to new object format
        if (typeof bookObj.image === 'string') {
            bookObj.image = {
                url: bookObj.image,
                uploadedAt: book.createdAt || new Date()
            };
        }

        // Generate signed URL for S3 images if needed
        if (bookObj.image && bookObj.image.url && typeof bookObj.image.url === 'string') {
            const imageUrl = bookObj.image.url;

            // Check if this is an S3 URL that needs a signed version
            if (imageUrl.includes('.s3.') && !imageUrl.includes('?X-Amz-Signature')) {
                try {
                    // Extract the S3 key from the URL
                    // URL format: https://bucket.s3.region.amazonaws.com/key
                    const urlParts = imageUrl.split('.amazonaws.com/');
                    if (urlParts.length === 2) {
                        const s3Key = decodeURIComponent(urlParts[1]);
                        const signedUrlResult = await getSignedDownloadUrl(s3Key, 3600); // 1 hour
                        if (signedUrlResult.success) {
                            bookObj.image.url = signedUrlResult.url;
                            bookObj.image.signedUntil = signedUrlResult.expiresAt;
                        }
                    }
                } catch (signedUrlError) {
                    console.warn('Could not generate signed URL for image:', signedUrlError.message);
                    // Fall back to original URL
                }
            }
        }

        return bookObj;
    } catch (error) {
        console.error('Error normalizing book:', error);
        return book;
    }
}

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

            let books = await Book.find(query).populate('sellerId', 'username email').sort({ createdAt: -1 });

            // Normalize all books (with signed URLs for S3 images)
            books = await Promise.all(books.map(normalizeBook));

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
            let book = await Book.findById(req.params.id).populate('sellerId', 'username email');
            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Book not found',
                });
            }

            // Normalize the book
            book = await normalizeBook(book);

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
                image: (image || imageUrl) ? {
                    url: image || imageUrl,
                    uploadedAt: new Date()
                } : undefined,
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

            // Normalize the book
            const normalizedBook = normalizeBook(book);

            res.status(200).json({
                success: true,
                message: 'Book updated successfully',
                data: normalizedBook,
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

            let books = await Book.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { author: { $regex: query, $options: 'i' } },
                    { genre: { $regex: query, $options: 'i' } },
                ],
            }).populate('sellerId', 'username email').sort({ createdAt: -1 });

            // Normalize all books
            books = books.map(normalizeBook);

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
