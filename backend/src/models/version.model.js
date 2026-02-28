const mongoose = require('mongoose')

const versionSchema = new mongoose.Schema(
    {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            required: true,
            index: true,
        },

        versionNumber: {
            type: Number,
            required: true,
        },

        name: {
            type: String,
            required: true,
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

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
)

// Compound index for efficient version lookup
versionSchema.index({ fileId: 1, versionNumber: -1 })

module.exports = mongoose.model('Version', versionSchema)
