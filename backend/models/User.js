const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
        },
        phone: String,
        profilePicture: {
            url: {
                type: String,
                default: null,
            },
            key: {
                type: String,
                description: 'S3 object key for file management'
            },
            uploadedAt: {
                type: Date
            }
        },
        role: {
            type: [String],
            enum: ['buyer', 'seller', 'admin'],
            default: ['buyer'],
        },
        isSeller: {
            type: Boolean,
            default: false,
        },
        sellerInfo: {
            storeName: String,
            description: String,
            bankAccount: String,
            rating: {
                type: Number,
                default: 5.0,
                min: 0,
                max: 5,
            },
            totalSales: {
                type: Number,
                default: 0,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        accountStatus: {
            type: String,
            enum: ['active', 'suspended', 'deleted'],
            default: 'active',
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);
