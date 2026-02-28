const mongoose = require('mongoose')

const trashSchema = new mongoose.Schema(
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
            index: true,
        },

        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        restoreParentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },

        name: {
            type: String,
            required: true,
        },

        deletedAt: {
            type: Date,
            default: Date.now,
        },

        // Auto-delete after 30 days
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            index: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Trash', trashSchema)
