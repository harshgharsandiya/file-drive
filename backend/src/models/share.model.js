const mongoose = require('mongoose')

const shareSchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        itemType: {
            type: String,
            enum: ['file', 'folder'],
            required: true,
        },

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        sharedWith: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // null = public link
        },

        permission: {
            type: String,
            enum: ['view', 'comment', 'edit'],
            default: 'view',
        },

        linkToken: {
            type: String,
            unique: true,
            sparse: true, // allows multiple nulls
        },

        expiresAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
)

// Prevent duplicate shares
shareSchema.index({ itemId: 1, sharedWith: 1 }, { unique: true, sparse: true })
shareSchema.index({ linkToken: 1 })

module.exports = mongoose.model('Share', shareSchema)
