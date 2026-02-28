const mongoose = require('mongoose')
const Folder = require('../models/folder.model')
const File = require('../models/file.model')
const Trash = require('../models/trash.model')
const AppError = require('../utils/AppError')
const activityService = require('./activity.service')

/**
 * Create a new folder
 * @param {string} userId
 * @param {Object} data - { name, parentId, clientId }
 * @returns {Promise<Object>} created folder
 * @throws {AppError} if folder already exists or parent not found
 */
exports.createFolder = async (userId, { name, parentId, clientId }) => {
    const exists = await Folder.findOne({
        ownerId: userId,
        parentId: parentId || null,
        name,
        isDeleted: false,
    })
    if (exists)
        throw new AppError('Folder already exists in this location', 409)

    let storagePath = `${userId}`
    if (parentId) {
        const parent = await Folder.findById(parentId)
        if (!parent || parent.isDeleted)
            throw new AppError('Parent folder not found', 404)
        storagePath = `${parent.storagePath}/${name}`
    } else {
        storagePath = `${userId}/root/${name}`
    }

    const folder = await Folder.create({
        name,
        parentId: parentId || null,
        ownerId: userId,
        clientId,
        storagePath,
        lastModifiedBy: userId,
    })

    await activityService.log({
        userId,
        itemId: folder._id,
        itemType: 'folder',
        action: 'create',
        itemName: name,
        metadata: { name },
    })

    return folder
}

/**
 * Get root level contents (folders + files)
 * @param {string} userId
 * @param {Object} options - { page, limit, sort, order }
 * @returns {Promise<{folders: Array, files: Array, totalFolders: number, totalFiles: number}>}
 */
exports.getRootContents = async (
    userId,
    { page = 1, limit = 50, sort = 'name', order = 'asc' } = {}
) => {
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 }
    const skip = (page - 1) * limit

    const folderQuery = {
        ownerId: userId,
        parentId: null,
        isDeleted: false,
        isTrashed: { $ne: true },
    }
    const fileQuery = {
        ownerId: userId,
        folderId: null,
        isDeleted: false,
        isTrashed: { $ne: true },
    }

    const [folders, files, totalFolders, totalFiles] = await Promise.all([
        Folder.find(folderQuery).sort(sortObj).skip(skip).limit(limit),
        File.find(fileQuery).sort(sortObj).skip(skip).limit(limit),
        Folder.countDocuments(folderQuery),
        File.countDocuments(fileQuery),
    ])

    return { folders, files, totalFolders, totalFiles }
}

/**
 * Get folder children (subfolders + files)
 * @param {string} userId
 * @param {string} folderId
 * @param {Object} options
 * @returns {Promise<{folders: Array, files: Array, totalFolders: number, totalFiles: number}>}
 */
exports.getFolderContents = async (
    userId,
    folderId,
    { page = 1, limit = 50, sort = 'name', order = 'asc' } = {}
) => {
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 }
    const skip = (page - 1) * limit

    const folderQuery = {
        ownerId: userId,
        parentId: folderId,
        isDeleted: false,
        isTrashed: { $ne: true },
    }
    const fileQuery = {
        ownerId: userId,
        folderId,
        isDeleted: false,
        isTrashed: { $ne: true },
    }

    const [folders, files, totalFolders, totalFiles] = await Promise.all([
        Folder.find(folderQuery).sort(sortObj).skip(skip).limit(limit),
        File.find(fileQuery).sort(sortObj).skip(skip).limit(limit),
        Folder.countDocuments(folderQuery),
        File.countDocuments(fileQuery),
    ])

    return { folders, files, totalFolders, totalFiles }
}

/**
 * Rename a folder
 * @param {string} userId
 * @param {string} folderId
 * @param {string} newName
 * @returns {Promise<Object>} updated folder
 */
exports.renameFolder = async (userId, folderId, newName) => {
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    // Check unique name within parent
    const duplicate = await Folder.findOne({
        ownerId: userId,
        parentId: folder.parentId,
        name: newName,
        _id: { $ne: folderId },
        isDeleted: false,
    })
    if (duplicate)
        throw new AppError('A folder with this name already exists here', 409)

    const oldName = folder.name
    folder.name = newName
    folder.syncVersion += 1
    folder.lastModifiedBy = userId
    await folder.save()

    await activityService.log({
        userId,
        itemId: folder._id,
        itemType: 'folder',
        action: 'rename',
        itemName: newName,
        metadata: { oldName, newName },
    })

    return folder
}

/**
 * Move a folder to a new parent (prevent circular moves)
 * @param {string} userId
 * @param {string} folderId
 * @param {string|null} newParentId
 * @returns {Promise<Object>} updated folder
 */
exports.moveFolder = async (userId, folderId, newParentId) => {
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    if (folderId === newParentId)
        throw new AppError('Cannot move folder into itself', 400)

    // Prevent circular moves
    if (newParentId) {
        let current = await Folder.findById(newParentId)
        while (current) {
            if (current._id.toString() === folderId) {
                throw new AppError(
                    'Cannot move folder into its own descendant',
                    400
                )
            }
            current = current.parentId
                ? await Folder.findById(current.parentId)
                : null
        }
    }

    folder.parentId = newParentId || null
    folder.syncVersion += 1
    folder.lastModifiedBy = userId
    await folder.save()

    await activityService.log({
        userId,
        itemId: folder._id,
        itemType: 'folder',
        action: 'move',
        itemName: folder.name,
        metadata: { newParentId },
    })

    return folder
}

/**
 * Soft-delete a folder and recursively trash children
 * @param {string} userId
 * @param {string} folderId
 * @returns {Promise<void>}
 */
exports.deleteFolder = async (userId, folderId) => {
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    // Recursively mark children as deleted
    await trashFolderRecursive(folderId, userId)

    folder.isDeleted = true
    folder.isTrashed = true
    folder.trashedAt = new Date()
    folder.deletedAt = new Date()
    folder.syncVersion += 1
    await folder.save()

    await Trash.create({
        itemId: folder._id,
        itemType: 'folder',
        ownerId: userId,
        deletedBy: userId,
        restoreParentId: folder.parentId,
        name: folder.name,
    })

    await activityService.log({
        userId,
        itemId: folder._id,
        itemType: 'folder',
        action: 'delete',
        itemName: folder.name,
        metadata: { name: folder.name },
    })
}

/**
 * Recursively mark folder contents as deleted
 */
async function trashFolderRecursive(folderId, userId) {
    // Mark files in this folder
    await File.updateMany(
        { folderId, ownerId: userId, isDeleted: false },
        {
            isDeleted: true,
            isTrashed: true,
            trashedAt: new Date(),
            deletedAt: new Date(),
        }
    )

    // Recurse subfolders
    const children = await Folder.find({
        parentId: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    for (const child of children) {
        await trashFolderRecursive(child._id, userId)
        child.isDeleted = true
        child.isTrashed = true
        child.trashedAt = new Date()
        child.deletedAt = new Date()
        await child.save()
    }
}

/**
 * Get full breadcrumb path from root to folder
 * @param {string} userId
 * @param {string} folderId
 * @returns {Promise<Array>} [{_id, name}, ...]
 */
exports.getFolderPath = async (userId, folderId) => {
    const path = []
    let current = await Folder.findOne({ _id: folderId, ownerId: userId })

    while (current) {
        path.unshift({ _id: current._id, name: current.name })
        current = current.parentId
            ? await Folder.findOne({ _id: current.parentId, ownerId: userId })
            : null
    }

    return path
}

/**
 * Get a nested folder tree (for move-to picker)
 * @param {string} userId
 * @param {string|null} parentId
 * @returns {Promise<Array>} nested tree
 */
exports.getFolderTree = async (userId, parentId = null) => {
    const folders = await Folder.find({
        ownerId: userId,
        parentId,
        isDeleted: false,
        isTrashed: { $ne: true },
    })
        .sort({ name: 1 })
        .select('_id name parentId color')

    const tree = []
    for (const folder of folders) {
        const children = await exports.getFolderTree(userId, folder._id)
        tree.push({
            _id: folder._id,
            name: folder.name,
            color: folder.color,
            children,
        })
    }

    return tree
}

/**
 * Set folder color
 * @param {string} userId
 * @param {string} folderId
 * @param {string} color - hex or predefined color name
 * @returns {Promise<Object>}
 */
exports.setColor = async (userId, folderId, color) => {
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    folder.color = color
    folder.syncVersion += 1
    await folder.save()

    return folder
}

/**
 * Toggle star on a folder
 * @param {string} userId
 * @param {string} folderId
 * @returns {Promise<Object>}
 */
exports.toggleStar = async (userId, folderId) => {
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    folder.isStarred = !folder.isStarred
    folder.syncVersion += 1
    await folder.save()

    await activityService.log({
        userId,
        itemId: folder._id,
        itemType: 'folder',
        action: folder.isStarred ? 'star' : 'unstar',
        itemName: folder.name,
    })

    return folder
}

/**
 * Duplicate a folder and all its contents recursively
 * @param {string} userId
 * @param {string} folderId
 * @returns {Promise<Object>} the new folder
 */
exports.duplicateFolder = async (userId, folderId) => {
    const storageService = require('./storage.service')
    const folder = await Folder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!folder) throw new AppError('Folder not found', 404)

    const newFolder = await Folder.create({
        name: `Copy of ${folder.name}`,
        parentId: folder.parentId,
        ownerId: userId,
        storagePath: `${folder.storagePath}_copy_${Date.now()}`,
        lastModifiedBy: userId,
    })

    // Duplicate files within
    const files = await File.find({
        folderId,
        ownerId: userId,
        isDeleted: false,
    })
    for (const file of files) {
        const crypto = require('crypto')
        const path = require('path')
        const ext = path.extname(file.name)
        const newKey = `${userId}/${newFolder._id}/${crypto.randomUUID()}${ext}`
        try {
            await storageService.copyFile(file.storagePath, newKey)
        } catch {
            /* skip if copy fails */
        }

        await File.create({
            ownerId: userId,
            folderId: newFolder._id,
            name: file.name,
            type: file.type,
            mimeType: file.mimeType,
            size: file.size,
            storagePath: newKey,
            lastModifiedBy: userId,
        })
    }

    // Recurse subfolders
    const subfolders = await Folder.find({
        parentId: folderId,
        ownerId: userId,
        isDeleted: false,
    })
    for (const sub of subfolders) {
        // For each subfolder, create it under newFolder and duplicate its contents
        const dupSub = await Folder.create({
            name: sub.name,
            parentId: newFolder._id,
            ownerId: userId,
            storagePath: `${newFolder.storagePath}/${sub.name}`,
            lastModifiedBy: userId,
        })
        await duplicateContents(userId, sub._id, dupSub._id, storageService)
    }

    await activityService.log({
        userId,
        itemId: newFolder._id,
        itemType: 'folder',
        action: 'duplicate',
        itemName: newFolder.name,
    })

    return newFolder
}

/**
 * Helper: duplicate contents of a folder into another folder
 */
async function duplicateContents(
    userId,
    srcFolderId,
    destFolderId,
    storageService
) {
    const crypto = require('crypto')
    const path = require('path')

    const files = await File.find({
        folderId: srcFolderId,
        ownerId: userId,
        isDeleted: false,
    })
    for (const file of files) {
        const ext = path.extname(file.name)
        const newKey = `${userId}/${destFolderId}/${crypto.randomUUID()}${ext}`
        try {
            await storageService.copyFile(file.storagePath, newKey)
        } catch {
            /* skip */
        }
        await File.create({
            ownerId: userId,
            folderId: destFolderId,
            name: file.name,
            type: file.type,
            mimeType: file.mimeType,
            size: file.size,
            storagePath: newKey,
            lastModifiedBy: userId,
        })
    }

    const subfolders = await Folder.find({
        parentId: srcFolderId,
        ownerId: userId,
        isDeleted: false,
    })
    for (const sub of subfolders) {
        const dupSub = await Folder.create({
            name: sub.name,
            parentId: destFolderId,
            ownerId: userId,
            storagePath: `${userId}/${destFolderId}/${sub.name}`,
            lastModifiedBy: userId,
        })
        await duplicateContents(userId, sub._id, dupSub._id, storageService)
    }
}
