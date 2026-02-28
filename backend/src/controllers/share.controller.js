const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const shareService = require('../services/share.service')

exports.shareWithUser = asyncHandler(async (req, res) => {
    const share = await shareService.shareWithUser(req.user.id, req.body)
    success(res, share, 'Shared successfully', 201)
})

exports.createPublicLink = asyncHandler(async (req, res) => {
    const share = await shareService.createPublicLink(req.user.id, req.body)
    success(
        res,
        {
            ...share.toObject(),
            shareLink: `/api/shares/link/${share.linkToken}`,
        },
        'Public link created',
        201
    )
})

exports.getSharedWithMe = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query
    const result = await shareService.getSharedWithMe(req.user.id, {
        page: +page,
        limit: +limit,
    })
    paginated(res, result.items, +page, +limit, result.total)
})

exports.getSharedByMe = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query
    const result = await shareService.getSharedByMe(req.user.id, {
        page: +page,
        limit: +limit,
    })
    paginated(res, result.items, +page, +limit, result.total)
})

exports.getItemShares = asyncHandler(async (req, res) => {
    const shares = await shareService.getItemShares(
        req.user.id,
        req.params.itemId
    )
    success(res, shares)
})

exports.updatePermission = asyncHandler(async (req, res) => {
    const share = await shareService.updatePermission(
        req.user.id,
        req.params.shareId,
        req.body.permission
    )
    success(res, share, 'Permission updated')
})

exports.revokeShare = asyncHandler(async (req, res) => {
    await shareService.revokeShare(req.user.id, req.params.shareId)
    success(res, null, 'Share removed')
})

exports.accessPublicLink = asyncHandler(async (req, res) => {
    const data = await shareService.accessPublicLink(req.params.token)
    success(res, data)
})
