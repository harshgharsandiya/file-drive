const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const notificationService = require('../services/notification.service')

exports.list = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query
    const result = await notificationService.list(req.user.id, {
        page: +page,
        limit: +limit,
    })
    res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: {
            page: +page,
            limit: +limit,
            total: result.total,
            pages: Math.ceil(result.total / +limit),
        },
    })
})

exports.markRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(
        req.user.id,
        req.params.notificationId
    )
    success(res, notification, 'Marked as read')
})

exports.markAllRead = asyncHandler(async (req, res) => {
    const count = await notificationService.markAllRead(req.user.id)
    success(res, { updatedCount: count }, 'All marked as read')
})

exports.remove = asyncHandler(async (req, res) => {
    await notificationService.remove(req.user.id, req.params.notificationId)
    success(res, null, 'Notification deleted')
})

exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id)
    success(res, { count })
})
