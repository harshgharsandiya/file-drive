const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const fileService = require('../services/file.service')
const AppError = require('../utils/AppError')

exports.uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400)
    const file = await fileService.uploadFile(req.user.id, req.file, req.body)
    success(res, file, 'File uploaded successfully', 201)
})

exports.initUpload = asyncHandler(async (req, res) => {
    const data = await fileService.initUpload(req.user.id, req.body)
    success(res, data)
})

exports.completeUpload = asyncHandler(async (req, res) => {
    const file = await fileService.completeUpload(req.user.id, req.body)
    success(res, file, 'Upload completed', 201)
})

exports.getFile = asyncHandler(async (req, res) => {
    const data = await fileService.getFileInfo(req.user.id, req.params.fileId)
    success(res, data)
})

exports.downloadFile = asyncHandler(async (req, res) => {
    const data = await fileService.getDownloadUrl(
        req.user.id,
        req.params.fileId
    )
    success(res, data)
})

exports.previewFile = asyncHandler(async (req, res) => {
    const data = await fileService.getPreviewUrl(req.user.id, req.params.fileId)
    success(res, data)
})

exports.renameFile = asyncHandler(async (req, res) => {
    const file = await fileService.renameFile(
        req.user.id,
        req.params.fileId,
        req.body.name,
        req.isOwner !== false // true if owner or flag not set
    )
    success(res, file, 'File renamed')
})

exports.moveFile = asyncHandler(async (req, res) => {
    // moveFile is owner-only (RBAC enforces), but pass flag for consistency
    const file = await fileService.moveFile(
        req.user.id,
        req.params.fileId,
        req.body.folderId
    )
    success(res, file, 'File moved')
})

exports.deleteFile = asyncHandler(async (req, res) => {
    await fileService.deleteFile(req.user.id, req.params.fileId)
    success(res, null, 'File moved to trash')
})

exports.toggleStar = asyncHandler(async (req, res) => {
    const file = await fileService.toggleStar(
        req.user.id,
        req.params.fileId,
        req.isOwner !== false
    )
    success(res, file, file.isStarred ? 'File starred' : 'File unstarred')
})

exports.duplicateFile = asyncHandler(async (req, res) => {
    const file = await fileService.duplicateFile(
        req.user.id,
        req.params.fileId,
        req.isOwner !== false
    )
    success(res, file, 'File duplicated', 201)
})

exports.updateDescription = asyncHandler(async (req, res) => {
    const file = await fileService.updateDescription(
        req.user.id,
        req.params.fileId,
        req.body.description,
        req.isOwner !== false
    )
    success(res, file, 'Description updated')
})

exports.updateLabels = asyncHandler(async (req, res) => {
    const file = await fileService.updateLabels(
        req.user.id,
        req.params.fileId,
        req.body.labels,
        req.isOwner !== false
    )
    success(res, file, 'Labels updated')
})

exports.getRecentFiles = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query
    const files = await fileService.getRecentFiles(req.user.id, +limit)
    success(res, files)
})

exports.getStarredFiles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query
    const result = await fileService.getStarredFiles(req.user.id, {
        page: +page,
        limit: +limit,
    })
    paginated(res, result.files, +page, +limit, result.total)
})

exports.getFilesByType = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query
    const result = await fileService.getFilesByType(
        req.user.id,
        req.params.category,
        { page: +page, limit: +limit }
    )
    paginated(res, result.files, +page, +limit, result.total)
})

exports.getVersions = asyncHandler(async (req, res) => {
    const versions = await fileService.getVersions(
        req.user.id,
        req.params.fileId
    )
    success(res, versions)
})

exports.restoreVersion = asyncHandler(async (req, res) => {
    const file = await fileService.restoreVersion(
        req.user.id,
        req.params.fileId,
        req.params.versionId
    )
    success(res, file, 'Version restored')
})

exports.uploadNewVersion = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400)
    const file = await fileService.uploadNewVersion(
        req.user.id,
        req.params.fileId,
        req.file
    )
    success(res, file, 'New version uploaded')
})

exports.deleteVersion = asyncHandler(async (req, res) => {
    await fileService.deleteVersion(
        req.user.id,
        req.params.fileId,
        req.params.versionId
    )
    success(res, null, 'Version deleted')
})
