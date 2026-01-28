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
        image: {
            type: String,
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

module.exports = mongoose.model('Book', bookSchema);
