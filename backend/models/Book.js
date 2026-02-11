const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: String,
            required: true,
            trim: true,
        },
        isbn: {
            type: String,
            unique: true,
            sparse: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quality: {
            type: String,
            enum: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
            default: 'Good',
        },
        genre: {
            type: String,
            trim: true,
        },
        image: mongoose.Schema.Types.Mixed,
        images: [{
            url: {
                type: String,
                description: 'S3 URL to book image'
            },
            key: {
                type: String,
                description: 'S3 object key'
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        bookFile: {
            url: {
                type: String,
                description: 'S3 URL to downloadable book file (PDF, EPUB, MOBI)'
            },
            key: {
                type: String,
                description: 'S3 object key for file management'
            },
            fileType: {
                type: String,
                enum: ['pdf', 'epub', 'mobi']
            },
            uploadedAt: {
                type: Date
            }
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        featured: {
            type: Boolean,
            default: false,
        },
        isNewBook: {
            type: Boolean,
            default: false,
        },
        originalPrice: {
            type: Number,
            min: 0,
        },
        quantity: {
            type: Number,
            default: 1,
            min: 0,
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        sellerName: {
            type: String,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// Post hook to normalize image field for backwards compatibility
bookSchema.post('find', function (docs) {
    if (Array.isArray(docs)) {
        docs.forEach(doc => {
            if (doc && doc.image && typeof doc.image === 'string') {
                const imageUrl = doc.image;
                doc.image = {
                    url: imageUrl,
                    uploadedAt: doc.createdAt || new Date()
                };
            }
        });
    }
});

bookSchema.post('findOne', function (doc) {
    if (doc && doc.image && typeof doc.image === 'string') {
        const imageUrl = doc.image;
        doc.image = {
            url: imageUrl,
            uploadedAt: doc.createdAt || new Date()
        };
    }
});

bookSchema.post('findOneAndUpdate', function (doc) {
    if (doc && doc.image && typeof doc.image === 'string') {
        const imageUrl = doc.image;
        doc.image = {
            url: imageUrl,
            uploadedAt: doc.createdAt || new Date()
        };
    }
});

module.exports = mongoose.model('Book', bookSchema);
