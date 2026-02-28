const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const searchService = require('../services/search.service')
const AppError = require('../utils/AppError')

exports.search = asyncHandler(async (req, res) => {
    const {
        q,
        type,
        dateFrom,
        dateTo,
        minSize,
        maxSize,
        starred,
        page = 1,
        limit = 50,
    } = req.query
    if (!q || q.trim().length === 0)
        throw new AppError('Search query is required', 400)

    const result = await searchService.search(req.user.id, {
        q,
        type,
        dateFrom,
        dateTo,
        minSize,
        maxSize,
        starred,
        page: +page,
        limit: +limit,
    })

    res.json({
        success: true,
        data: { files: result.files, folders: result.folders },
        pagination: {
            page: +page,
            limit: +limit,
            totalFiles: result.totalFiles,
            totalFolders: result.totalFolders,
        },
    })
})

exports.suggest = asyncHandler(async (req, res) => {
    const { q } = req.query
    const suggestions = await searchService.suggest(req.user.id, q)
    success(res, suggestions)
})
