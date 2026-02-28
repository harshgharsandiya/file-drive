const Notification = require('../models/notification.model')

/**
 * Create a notification
 * @param {Object} data - { userId, type, message, relatedFileId, relatedFolderId }
 * @returns {Promise<Object>}
 */
exports.create = async ({
    userId,
    type,
    message,
    relatedFileId,
    relatedFolderId,
}) => {
    return Notification.create({
        userId,
        type,
        message,
        relatedFileId,
        relatedFolderId,
    })
}

/**
 * Get paginated notifications for a user
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<{notifications: Array, total: number, unreadCount: number}>}
 */
exports.list = async (userId, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit
    const query = { userId }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments(query),
        Notification.countDocuments({ userId, read: false }),
    ])

    return { notifications, total, unreadCount }
}

/**
 * Mark a single notification as read
 * @param {string} userId
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
exports.markRead = async (userId, notificationId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
    )
    return notification
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId
 * @returns {Promise<number>} number of updated docs
 */
exports.markAllRead = async (userId) => {
    const result = await Notification.updateMany(
        { userId, read: false },
        { read: true }
    )
    return result.modifiedCount
}

/**
 * Delete a notification
 * @param {string} userId
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
exports.remove = async (userId, notificationId) => {
    await Notification.findOneAndDelete({ _id: notificationId, userId })
}

/**
 * Get unread count
 * @param {string} userId
 * @returns {Promise<number>}
 */
exports.getUnreadCount = async (userId) => {
    return Notification.countDocuments({ userId, read: false })
}

/**
 * Delete old read notifications (older than 30 days)
 * @returns {Promise<number>}
 */
exports.purgeOld = async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = await Notification.deleteMany({
        read: true,
        createdAt: { $lt: cutoff },
    })
    return result.deletedCount
}
