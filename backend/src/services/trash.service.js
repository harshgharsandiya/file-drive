const File = require('../models/file.model')
const Folder = require('../models/folder.model')
const Trash = require('../models/trash.model')
const Version = require('../models/version.model')
const Share = require('../models/share.model')
const User = require('../models/user.model')
const storageService = require('./storage.service')
const activityService = require('./activity.service')
const AppError = require('../utils/AppError')

/**
 * Get trash items (paginated)
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<{items: Array, total: number}>}
 */
exports.list = async (userId, { page = 1, limit = 50 }) => {
    const skip = (page - 1) * limit
    const query = { ownerId: userId }

    const [trashItems, total] = await Promise.all([
        Trash.find(query).sort({ deletedAt: -1 }).skip(skip).limit(limit),
        Trash.countDocuments(query),
    ])

    // Enrich with item data
    const items = []
    for (const t of trashItems) {
        const Model = t.itemType === 'file' ? File : Folder
        const item = await Model.findById(t.itemId)
        if (item) {
            items.push({
                trashId: t._id,
                itemId: t.itemId,
                itemType: t.itemType,
                name: t.name,
                restoreParentId: t.restoreParentId,
                deletedAt: t.deletedAt,
                expiresAt: t.expiresAt,
                item: item.toObject(),
            })
        }
    }

    return { items, total }
}

/**
 * Restore a single item from trash
 * @param {string} userId
 * @param {string} trashId
 * @returns {Promise<Object>}
 */
exports.restore = async (userId, trashId) => {
    const trashEntry = await Trash.findOne({ _id: trashId, ownerId: userId })
    if (!trashEntry) throw new AppError('Trash item not found', 404)

    const Model = trashEntry.itemType === 'file' ? File : Folder

    // Check if restore parent still exists
    let restoreToFolder = null
    if (trashEntry.restoreParentId) {
        const parentFolder = await Folder.findOne({
            _id: trashEntry.restoreParentId,
            isDeleted: false,
        })
        restoreToFolder = parentFolder ? parentFolder._id : null
    }

    if (trashEntry.itemType === 'file') {
        await File.findByIdAndUpdate(trashEntry.itemId, {
            isDeleted: false,
            isTrashed: false,
            trashedAt: null,
            deletedAt: null,
            folderId: restoreToFolder,
        })
    } else {
        // Restore folder and all nested items
        await restoreFolderRecursive(trashEntry.itemId, restoreToFolder)
    }

    await Trash.deleteOne({ _id: trashId })

    await activityService.log({
        userId,
        itemId: trashEntry.itemId,
        itemType: trashEntry.itemType,
        action: 'restore',
        itemName: trashEntry.name,
    })

    const item = await Model.findById(trashEntry.itemId)
    return item
}

/**
 * Recursively restore a folder and its contents
 * @param {string} folderId
 * @param {string|null} parentId
 */
async function restoreFolderRecursive(folderId, parentId) {
    const folder = await Folder.findById(folderId)
    if (!folder) return

    folder.isDeleted = false
    folder.isTrashed = false
    folder.trashedAt = null
    if (parentId !== undefined) folder.parentId = parentId
    await folder.save()

    // Restore files in this folder
    await File.updateMany(
        { folderId, isTrashed: true },
        { isDeleted: false, isTrashed: false, trashedAt: null, deletedAt: null }
    )

    // Restore child folders
    const childFolders = await Folder.find({
        parentId: folderId,
        isTrashed: true,
    })
    for (const child of childFolders) {
        await restoreFolderRecursive(child._id, folderId)
    }
}

/**
 * Permanently delete a single trash item
 * @param {string} userId
 * @param {string} trashId
 * @returns {Promise<void>}
 */
exports.permanentDelete = async (userId, trashId) => {
    const trashEntry = await Trash.findOne({ _id: trashId, ownerId: userId })
    if (!trashEntry) throw new AppError('Trash item not found', 404)

    if (trashEntry.itemType === 'file') {
        await permanentDeleteFile(trashEntry.itemId, userId)
    } else {
        await permanentDeleteFolder(trashEntry.itemId, userId)
    }

    await Trash.deleteOne({ _id: trashId })
}

/**
 * Permanently delete a file and its storage objects
 * @param {string} fileId
 * @param {string} userId
 */
async function permanentDeleteFile(fileId, userId) {
    const file = await File.findById(fileId)
    if (!file) return

    // Delete all versions from storage
    const versions = await Version.find({ fileId })
    for (const v of versions) {
        try {
            await storageService.deleteFile(v.storagePath)
        } catch {
            /* skip */
        }
    }
    await Version.deleteMany({ fileId })

    // Delete main file from storage
    try {
        await storageService.deleteFile(file.storagePath)
    } catch {
        /* skip */
    }

    // Delete shares
    await Share.deleteMany({ itemId: fileId })

    // Decrement storage
    const user = await User.findById(userId)
    if (user) {
        user.storageUsed = Math.max(0, user.storageUsed - file.size)
        await user.save()
    }

    await File.deleteOne({ _id: fileId })
}

/**
 * Permanently delete a folder and all contents
 * @param {string} folderId
 * @param {string} userId
 */
async function permanentDeleteFolder(folderId, userId) {
    // Delete all files in this folder
    const files = await File.find({ folderId })
    for (const f of files) {
        await permanentDeleteFile(f._id, userId)
    }

    // Recurse into child folders
    const childFolders = await Folder.find({ parentId: folderId })
    for (const child of childFolders) {
        await permanentDeleteFolder(child._id, userId)
    }

    // Delete shares on this folder
    await Share.deleteMany({ itemId: folderId })

    // Delete the folder
    await Folder.deleteOne({ _id: folderId })
}

/**
 * Empty entire trash for a user
 * @param {string} userId
 * @returns {Promise<number>} number of items deleted
 */
exports.emptyTrash = async (userId) => {
    const trashItems = await Trash.find({ ownerId: userId })

    for (const t of trashItems) {
        if (t.itemType === 'file') {
            await permanentDeleteFile(t.itemId, userId)
        } else {
            await permanentDeleteFolder(t.itemId, userId)
        }
    }

    const count = trashItems.length
    await Trash.deleteMany({ ownerId: userId })

    return count
}

/**
 * Auto-delete expired trash items (called by cron)
 * @returns {Promise<number>}
 */
exports.autoDeleteExpired = async () => {
    const expired = await Trash.find({ expiresAt: { $lte: new Date() } })
    let count = 0

    for (const t of expired) {
        try {
            if (t.itemType === 'file') {
                await permanentDeleteFile(t.itemId, t.ownerId.toString())
            } else {
                await permanentDeleteFolder(t.itemId, t.ownerId.toString())
            }
            await Trash.deleteOne({ _id: t._id })
            count++
        } catch (err) {
            console.error(`Auto-delete failed for trash ${t._id}:`, err.message)
        }
    }

    return count
}
