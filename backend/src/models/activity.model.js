const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        itemType: {
            type: String,
            enum: ['file', 'folder'],
            required: true,
        },

        action: {
            type: String,
            enum: [
                'upload',
                'download',
                'rename',
                'move',
                'delete',
                'restore',
                'share',
                'preview',
                'version',
                'create',
                'star',
                'unstar',
                'duplicate',
                'description',
            ],
            required: true,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        itemName: {
            type: String,
            default: '',
        },

        ip: {
            type: String,
        },

        userAgent: {
            type: String,
        },
    },
    { timestamps: true }
)

activitySchema.index({ createdAt: -1 })
activitySchema.index({ itemId: 1, createdAt: -1 })
activitySchema.index({ userId: 1, action: 1 })

module.exports = mongoose.model('Activity', activitySchema)
