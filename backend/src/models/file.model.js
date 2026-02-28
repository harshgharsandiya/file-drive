const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema(
    {
        clientId: {
            type: String,
            index: true,
        },

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        folderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
            index: true,
        },

        name: {
            type: String,
            required: true,
        },

        displayName: {
            type: String,
        },

        description: {
            type: String,
            default: '',
        },

        mimeType: {
            type: String,
        },

        type: {
            type: String,
        },

        size: {
            type: Number,
        },

        storagePath: {
            type: String,
            required: true,
        },

        thumbnailUrl: {
            type: String,
            default: null,
        },

        checksum: {
            type: String,
        },

        isStarred: {
            type: Boolean,
            default: false,
            index: true,
        },

        labels: {
            type: [String],
            default: [],
        },

        isTrashed: {
            type: Boolean,
            default: false,
            index: true,
        },

        trashedAt: {
            type: Date,
        },

        publicToken: {
            type: String,
        },

        publicTokenExpiry: {
            type: Date,
        },

        currentVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Version',
        },

        syncVersion: {
            type: Number,
            default: 1,
        },

        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        deletedAt: {
            type: Date,
        },
    },
    { timestamps: true }
)

fileSchema.index({ name: 'text', description: 'text' })
fileSchema.index({ ownerId: 1, folderId: 1, isDeleted: 1 })
fileSchema.index({ ownerId: 1, isStarred: 1 })
fileSchema.index({ ownerId: 1, isTrashed: 1 })
fileSchema.index({ ownerId: 1, updatedAt: -1 })
fileSchema.index({ publicToken: 1 }, { sparse: true })

module.exports = mongoose.model('File', fileSchema)
