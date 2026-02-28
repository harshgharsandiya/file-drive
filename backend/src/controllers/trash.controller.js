const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const trashService = require('../services/trash.service')

exports.getTrash = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query
    const result = await trashService.list(req.user.id, {
        page: +page,
        limit: +limit,
    })
    paginated(res, result.items, +page, +limit, result.total)
})

exports.restoreItem = asyncHandler(async (req, res) => {
    const item = await trashService.restore(req.user.id, req.params.trashId)
    success(res, item, 'Item restored successfully')
})

exports.permanentDelete = asyncHandler(async (req, res) => {
    await trashService.permanentDelete(req.user.id, req.params.trashId)
    success(res, null, 'Permanently deleted')
})

exports.emptyTrash = asyncHandler(async (req, res) => {
    const count = await trashService.emptyTrash(req.user.id)
    success(res, { deletedCount: count }, 'Trash emptied')
})
