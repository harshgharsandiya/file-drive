const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/response')
const folderService = require('../services/folder.service')

exports.createFolder = asyncHandler(async (req, res) => {
    const folder = await folderService.createFolder(req.user.id, req.body)
    success(res, folder, 'Folder created', 201)
})

exports.getRootChildren = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, sortBy, sortOrder } = req.query
    const result = await folderService.getRootContents(req.user.id, {
        page: +page,
        limit: +limit,
        sort: sortBy,
        order: sortOrder,
    })
    paginated(
        res,
        { folders: result.folders, files: result.files },
        +page,
        +limit,
        result.totalFolders + result.totalFiles
    )
})

exports.getFolderChildren = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, sortBy, sortOrder } = req.query
    const result = await folderService.getFolderContents(
        req.user.id,
        req.params.folderId,
        {
            page: +page,
            limit: +limit,
            sort: sortBy,
            order: sortOrder,
        }
    )
    paginated(
        res,
        { folders: result.folders, files: result.files },
        +page,
        +limit,
        result.totalFolders + result.totalFiles
    )
})

exports.renameFolder = asyncHandler(async (req, res) => {
    const folder = await folderService.renameFolder(
        req.user.id,
        req.params.folderId,
        req.body.name
    )
    success(res, folder, 'Folder renamed')
})

exports.moveFolder = asyncHandler(async (req, res) => {
    const folder = await folderService.moveFolder(
        req.user.id,
        req.params.folderId,
        req.body.parentId
    )
    success(res, folder, 'Folder moved')
})

exports.deleteFolder = asyncHandler(async (req, res) => {
    await folderService.deleteFolder(req.user.id, req.params.folderId)
    success(res, null, 'Folder moved to trash')
})

exports.getFolderPath = asyncHandler(async (req, res) => {
    const path = await folderService.getFolderPath(
        req.user.id,
        req.params.folderId
    )
    success(res, path)
})

exports.getFolderTree = asyncHandler(async (req, res) => {
    const tree = await folderService.getFolderTree(req.user.id)
    success(res, tree)
})

exports.setColor = asyncHandler(async (req, res) => {
    const folder = await folderService.setColor(
        req.user.id,
        req.params.folderId,
        req.body.color
    )
    success(res, folder, 'Folder color updated')
})

exports.toggleStar = asyncHandler(async (req, res) => {
    const folder = await folderService.toggleStar(
        req.user.id,
        req.params.folderId
    )
    success(
        res,
        folder,
        folder.isStarred ? 'Folder starred' : 'Folder unstarred'
    )
})

exports.duplicateFolder = asyncHandler(async (req, res) => {
    const folder = await folderService.duplicateFolder(
        req.user.id,
        req.params.folderId
    )
    success(res, folder, 'Folder duplicated', 201)
})
