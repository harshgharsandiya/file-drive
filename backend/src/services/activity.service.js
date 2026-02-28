const Activity = require('../models/activity.model')

/**
 * Log an activity event
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.itemId
 * @param {string} params.itemType - 'file' or 'folder'
 * @param {string} params.action
 * @param {Object} [params.metadata]
 * @param {string} [params.itemName]
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 */
exports.log = async ({
    userId,
    itemId,
    itemType,
    action,
    metadata = {},
    itemName = '',
    ip,
    userAgent,
}) => {
    try {
        await Activity.create({
            userId,
            itemId,
            itemType,
            action,
            metadata,
            itemName,
            ip,
            userAgent,
        })
    } catch (err) {
        console.error('Activity log error:', err.message)
    }
}

/**
 * Get paginated activities for a user
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<{activities: Array, total: number}>}
 */
exports.getUserActivities = async (
    userId,
    { page = 1, limit = 30, action, dateFrom, dateTo }
) => {
    const query = { userId }
    if (action) query.action = action
    if (dateFrom || dateTo) {
        query.createdAt = {}
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
        if (dateTo) query.createdAt.$lte = new Date(dateTo)
    }

    const skip = (page - 1) * limit
    const [activities, total] = await Promise.all([
        Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Activity.countDocuments(query),
    ])

    return { activities, total }
}

/**
 * Get activities for a specific file
 * @param {string} fileId
 * @param {Object} options
 * @returns {Promise<{activities: Array, total: number}>}
 */
exports.getFileActivities = async (fileId, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit
    const [activities, total] = await Promise.all([
        Activity.find({ itemId: fileId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Activity.countDocuments({ itemId: fileId }),
    ])
    return { activities, total }
}
