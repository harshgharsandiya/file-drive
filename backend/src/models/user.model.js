const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
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
        avatarUrl: {
            type: String,
            default: null,
        },

        otp: String,
        otpExpiresAt: Date,

        isVerified: {
            type: Boolean,
            default: false,
        },

        lastLoginAt: {
            type: Date,
        },

        // Storage quota
        storageUsed: {
            type: Number,
            default: 0,
        },
        storageLimit: {
            type: Number,
            default: 20 * 1024 * 1024, // 20 MB
        },

        // UI preferences
        preferences: {
            viewMode: { type: String, enum: ['grid', 'list'], default: 'grid' },
            defaultSort: { type: String, default: 'name' },
            itemsPerPage: { type: Number, default: 50 },
            theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
