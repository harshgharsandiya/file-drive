const mongoose = require('mongoose')

const folderSchema = new mongoose.Schema(
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

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        storagePath: {
            type: String,
        },

        color: {
            type: String,
            default: null,
        },

        isStarred: {
            type: Boolean,
            default: false,
            index: true,
        },

        isTrashed: {
            type: Boolean,
            default: false,
            index: true,
        },

        trashedAt: {
            type: Date,
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
    {
        timestamps: true,
    }
)

folderSchema.index({ name: 'text' })
folderSchema.index({ ownerId: 1, parentId: 1, isDeleted: 1 })
folderSchema.index({ ownerId: 1, isStarred: 1 })
folderSchema.index({ ownerId: 1, isTrashed: 1 })

module.exports = mongoose.model('Folder', folderSchema)
