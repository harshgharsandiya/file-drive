const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                'file_shared',
                'storage_warning',
                'file_comment',
                'link_accessed',
            ],
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        read: {
            type: Boolean,
            default: false,
            index: true,
        },

        relatedFileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            default: null,
        },

        relatedFolderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },
    },
    { timestamps: true }
)

notificationSchema.index({ userId: 1, read: 1 })
notificationSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
