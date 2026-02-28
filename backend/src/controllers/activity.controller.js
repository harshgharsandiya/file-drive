const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const activityService = require('../services/activity.service')

exports.getActivities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 30, action, dateFrom, dateTo } = req.query
    const result = await activityService.getUserActivities(req.user.id, {
        page: +page,
        limit: +limit,
        action,
        dateFrom,
        dateTo,
    })
    paginated(res, result.activities, +page, +limit, result.total)
})

exports.getFileActivities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query
    const result = await activityService.getFileActivities(req.params.fileId, {
        page: +page,
        limit: +limit,
    })
    paginated(res, result.activities, +page, +limit, result.total)
})
