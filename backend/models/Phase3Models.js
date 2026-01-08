const mongoose = require('mongoose');

// Cart Model
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [
        {
            bookId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            priceAtTime: {
                type: Number,
                required: true
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Order Model
const orderSchema = new mongoose.Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            bookId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
                required: true
            },
            title: String,
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        phone: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentIntentId: String,
    trackingNumber: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: Date,
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Review Model
const reviewSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    helpful: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure one review per user per book
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

// Create models
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = {
    Cart,
    Order,
    Review
};
