const path = require('path')
const crypto = require('crypto')
const mime = require('mime-types')

const File = require('../models/file.model')
const Folder = require('../models/folder.model')
const Version = require('../models/version.model')
const Trash = require('../models/trash.model')
const User = require('../models/user.model')

const storageService = require('./storage.service')
const activityService = require('./activity.service')
const AppError = require('../utils/AppError')

/**
 * Upload a file via multer buffer
 * @param {string} userId
 * @param {Object} file - multer file object
 * @param {Object} data - { folderId, clientId }
 * @returns {Promise<Object>} created file doc
 */
exports.uploadFile = async (userId, file, { folderId, clientId }) => {
    // Validate folder
    if (folderId) {
        const folder = await Folder.findOne({
            _id: folderId,
            ownerId: userId,
            isDeleted: false,
        })
        if (!folder) throw new AppError('Folder not found', 404)
    }

    // Check storage quota
    const user = await User.findById(userId)
    if (user.storageUsed + file.size > user.storageLimit) {
        throw new AppError(
            'Storage quota exceeded. Please free up space or upgrade.',
            403
        )
    }

    const ext = path.extname(file.originalname)
    const uniqueName = `${crypto.randomUUID()}${ext}`
    const storagePath = folderId
        ? `${userId}/${folderId}/${uniqueName}`
        : `${userId}/root/${uniqueName}`

    const checksum = crypto.createHash('md5').update(file.buffer).digest('hex')
    const contentType =
        file.mimetype ||
        mime.lookup(file.originalname) ||
        'application/octet-stream'

    await storageService.uploadFile(storagePath, file.buffer, contentType)

    // Generate thumbnail for images
    let thumbnailUrl = null
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (imageTypes.includes(contentType)) {
        try {
            const sharp = require('sharp')
            const thumbBuffer = await sharp(file.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 70 })
                .toBuffer()
            const thumbKey = `${userId}/thumbnails/${crypto.randomUUID()}.jpg`
            await storageService.uploadFile(thumbKey, thumbBuffer, 'image/jpeg')
            const thumbUrl = await storageService.getDownloadUrl(
                thumbKey,
                86400 * 30
            )
            thumbnailUrl = thumbUrl
        } catch {
            // Thumbnail generation is optional
        }
    }

    const fileDoc = await File.create({
        clientId,
        ownerId: userId,
        folderId: folderId || null,
        name: file.originalname,
        displayName: file.originalname,
        mimeType: contentType,
        type: ext.replace('.', ''),
        size: file.size,
        storagePath,
        thumbnailUrl,
        checksum,
        lastModifiedBy: userId,
    })

    // Create initial version
    const version = await Version.create({
        fileId: fileDoc._id,
        versionNumber: 1,
        name: file.originalname,
        type: ext.replace('.', ''),
        size: file.size,
        storagePath,
        uploadedBy: userId,
    })

    fileDoc.currentVersionId = version._id
    await fileDoc.save()

    // Increment storage used
    user.storageUsed += file.size
    await user.save()

    await activityService.log({
        userId,
        itemId: fileDoc._id,
        itemType: 'file',
        action: 'upload',
        itemName: file.originalname,
        metadata: { name: file.originalname, size: file.size },
    })

    return fileDoc
}

/**
 * Rename a file (display name only, storage path unchanged)
 * @param {string} userId
 * @param {string} fileId
 * @param {string} newName
 * @returns {Promise<Object>}
 */
exports.renameFile = async (userId, fileId, newName, isOwner = true) => {
    // RBAC middleware already validated permission; if not owner, skip ownerId filter
    const query = isOwner
        ? { _id: fileId, ownerId: userId, isDeleted: false }
        : { _id: fileId, isDeleted: false }
    const file = await File.findOne(query)
    if (!file) throw new AppError('File not found', 404)

    const oldName = file.name
    file.name = newName
    file.displayName = newName
    file.syncVersion += 1
    file.lastModifiedBy = userId
    await file.save()

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'rename',
        itemName: newName,
        metadata: { oldName, newName },
    })

    return file
}

/**
 * Move a file to a different folder
 * @param {string} userId
 * @param {string} fileId
 * @param {string|null} newFolderId
 * @returns {Promise<Object>}
 */
exports.moveFile = async (userId, fileId, newFolderId) => {
    const file = await File.findOne({
        _id: fileId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!file) throw new AppError('File not found', 404)

    if (newFolderId) {
        const folder = await Folder.findOne({
            _id: newFolderId,
            ownerId: userId,
            isDeleted: false,
        })
        if (!folder) throw new AppError('Target folder not found', 404)
    }

    const oldFolderId = file.folderId
    file.folderId = newFolderId || null
    file.syncVersion += 1
    file.lastModifiedBy = userId
    await file.save()

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'move',
        itemName: file.name,
        metadata: { oldFolderId, newFolderId },
    })

    return file
}

/**
 * Toggle star on a file
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<Object>}
 */
exports.toggleStar = async (userId, fileId, isOwner = true) => {
    const query = isOwner
        ? { _id: fileId, ownerId: userId, isDeleted: false }
        : { _id: fileId, isDeleted: false }
    const file = await File.findOne(query)
    if (!file) throw new AppError('File not found', 404)

    file.isStarred = !file.isStarred
    file.syncVersion += 1
    await file.save()

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: file.isStarred ? 'star' : 'unstar',
        itemName: file.name,
    })

    return file
}

/**
 * Get starred files for a user (paginated)
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<{files: Array, total: number}>}
 */
exports.getStarredFiles = async (userId, { page = 1, limit = 50 }) => {
    const query = { ownerId: userId, isStarred: true, isDeleted: false }
    const skip = (page - 1) * limit

    const [files, total] = await Promise.all([
        File.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
        File.countDocuments(query),
    ])

    return { files, total }
}

/**
 * Duplicate a file in the same folder
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<Object>}
 */
exports.duplicateFile = async (userId, fileId, isOwner = true) => {
    const query = isOwner
        ? { _id: fileId, ownerId: userId, isDeleted: false }
        : { _id: fileId, isDeleted: false }
    const file = await File.findOne(query)
    if (!file) throw new AppError('File not found', 404)

    const ext = path.extname(file.name)
    const newKey = `${userId}/${file.folderId || 'root'}/${crypto.randomUUID()}${ext}`

    try {
        await storageService.copyFile(file.storagePath, newKey)
    } catch (err) {
        throw new AppError('Failed to duplicate file in storage', 500)
    }

    const duplicated = await File.create({
        ownerId: userId,
        folderId: file.folderId,
        name: `Copy of ${file.name}`,
        displayName: `Copy of ${file.name}`,
        mimeType: file.mimeType,
        type: file.type,
        size: file.size,
        storagePath: newKey,
        thumbnailUrl: file.thumbnailUrl,
        lastModifiedBy: userId,
    })

    // Update storage
    const user = await User.findById(userId)
    user.storageUsed += file.size
    await user.save()

    await activityService.log({
        userId,
        itemId: duplicated._id,
        itemType: 'file',
        action: 'duplicate',
        itemName: duplicated.name,
        metadata: { originalId: fileId },
    })

    return duplicated
}

/**
 * Get full file info including shares, versions
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<Object>}
 */
exports.getFileInfo = async (userId, fileId) => {
    const Share = require('../models/share.model')

    const file = await File.findOne({ _id: fileId, isDeleted: false })
    if (!file) throw new AppError('File not found', 404)

    // Check access
    if (file.ownerId.toString() !== userId) {
        const hasShare = await Share.findOne({
            itemId: fileId,
            sharedWith: userId,
        })
        if (!hasShare) throw new AppError('Access denied', 403)
    }

    const [versions, shares] = await Promise.all([
        Version.find({ fileId })
            .sort({ versionNumber: -1 })
            .limit(10)
            .populate('uploadedBy', 'name email'),
        Share.find({ itemId: fileId }).populate('sharedWith', 'name email'),
    ])

    return {
        file,
        versions,
        shares,
    }
}

/**
 * Update file description
 * @param {string} userId
 * @param {string} fileId
 * @param {string} description
 * @returns {Promise<Object>}
 */
exports.updateDescription = async (
    userId,
    fileId,
    description,
    isOwner = true
) => {
    const query = isOwner
        ? { _id: fileId, ownerId: userId, isDeleted: false }
        : { _id: fileId, isDeleted: false }
    const file = await File.findOne(query)
    if (!file) throw new AppError('File not found', 404)

    file.description = description
    file.syncVersion += 1
    await file.save()

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'description',
        itemName: file.name,
    })

    return file
}

/**
 * Get recent files
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
exports.getRecentFiles = async (userId, limit = 20) => {
    return File.find({
        ownerId: userId,
        isDeleted: false,
        isTrashed: { $ne: true },
    })
        .sort({ updatedAt: -1 })
        .limit(limit)
}

/**
 * Get files filtered by MIME type category
 * @param {string} userId
 * @param {string} category - 'image', 'video', 'document', 'pdf', 'audio', 'archive'
 * @param {Object} options
 * @returns {Promise<{files: Array, total: number}>}
 */
exports.getFilesByType = async (userId, category, { page = 1, limit = 50 }) => {
    const mimeMap = {
        image: /^image\//,
        video: /^video\//,
        audio: /^audio\//,
        pdf: /application\/pdf/,
        document:
            /application\/(msword|vnd\.openxmlformats|vnd\.ms-excel|vnd\.ms-powerpoint)/,
        archive: /application\/(zip|x-rar|x-7z|gzip|x-tar)/,
    }

    const typeMap = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
        video: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
        audio: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
        pdf: ['pdf'],
        document: [
            'doc',
            'docx',
            'xls',
            'xlsx',
            'ppt',
            'pptx',
            'txt',
            'md',
            'csv',
        ],
        archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    }

    const types = typeMap[category] || []
    const query = {
        ownerId: userId,
        isDeleted: false,
        isTrashed: { $ne: true },
        type: { $in: types },
    }

    const skip = (page - 1) * limit
    const [files, total] = await Promise.all([
        File.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
        File.countDocuments(query),
    ])

    return { files, total }
}

/**
 * Update file labels
 * @param {string} userId
 * @param {string} fileId
 * @param {Array<string>} labels
 * @returns {Promise<Object>}
 */
exports.updateLabels = async (userId, fileId, labels, isOwner = true) => {
    const query = isOwner
        ? { _id: fileId, ownerId: userId, isDeleted: false }
        : { _id: fileId, isDeleted: false }
    const file = await File.findOne(query)
    if (!file) throw new AppError('File not found', 404)

    file.labels = labels
    file.syncVersion += 1
    await file.save()

    return file
}

/**
 * Soft-delete (trash) a file
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<void>}
 */
exports.deleteFile = async (userId, fileId) => {
    const file = await File.findOne({
        _id: fileId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!file) throw new AppError('File not found', 404)

    file.isDeleted = true
    file.isTrashed = true
    file.trashedAt = new Date()
    file.deletedAt = new Date()
    file.syncVersion += 1
    await file.save()

    await Trash.create({
        itemId: file._id,
        itemType: 'file',
        ownerId: userId,
        deletedBy: userId,
        restoreParentId: file.folderId,
        name: file.name,
    })

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'delete',
        itemName: file.name,
        metadata: { name: file.name },
    })
}

/**
 * Get download URL
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<{downloadUrl: string, fileName: string}>}
 */
exports.getDownloadUrl = async (userId, fileId) => {
    const Share = require('../models/share.model')
    const file = await File.findOne({ _id: fileId, isDeleted: false })
    if (!file) throw new AppError('File not found', 404)

    if (file.ownerId.toString() !== userId) {
        const hasShare = await Share.findOne({
            itemId: fileId,
            sharedWith: userId,
        })
        if (!hasShare) throw new AppError('Access denied', 403)
    }

    const downloadUrl = await storageService.getDownloadUrl(file.storagePath)

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'download',
        itemName: file.name,
    })

    return { downloadUrl, fileName: file.name }
}

/**
 * Get preview URL (short-lived)
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<Object>}
 */
exports.getPreviewUrl = async (userId, fileId) => {
    const Share = require('../models/share.model')
    const file = await File.findOne({ _id: fileId, isDeleted: false })
    if (!file) throw new AppError('File not found', 404)

    if (file.ownerId.toString() !== userId) {
        const hasShare = await Share.findOne({
            itemId: fileId,
            sharedWith: userId,
        })
        if (!hasShare) throw new AppError('Access denied', 403)
    }

    const previewableTypes = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        'pdf',
        'txt',
        'md',
        'json',
        'csv',
        'xml',
        'html',
        'css',
        'js',
        'mp4',
        'webm',
        'mp3',
        'wav',
        'ogg',
    ]

    const isPreviewable = previewableTypes.includes(file.type?.toLowerCase())
    if (!isPreviewable) throw new AppError('File type not previewable', 400)

    const previewUrl = await storageService.getDownloadUrl(file.storagePath, 60)

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'preview',
        itemName: file.name,
    })

    return {
        previewUrl,
        fileName: file.name,
        fileType: file.type,
        mimeType: file.mimeType,
        size: file.size,
    }
}

/**
 * Upload a new version of an existing file
 * @param {string} userId
 * @param {string} fileId
 * @param {Object} newFile - multer file
 * @returns {Promise<Object>}
 */
exports.uploadNewVersion = async (userId, fileId, newFile) => {
    const file = await File.findOne({
        _id: fileId,
        ownerId: userId,
        isDeleted: false,
    })
    if (!file) throw new AppError('File not found', 404)

    const user = await User.findById(userId)
    if (user.storageUsed + newFile.size > user.storageLimit) {
        throw new AppError('Storage quota exceeded', 403)
    }

    const ext = path.extname(newFile.originalname)
    const uniqueName = `${crypto.randomUUID()}${ext}`
    const storagePath = `${userId}/${file.folderId || 'root'}/versions/${uniqueName}`
    const contentType =
        newFile.mimetype ||
        mime.lookup(newFile.originalname) ||
        'application/octet-stream'

    await storageService.uploadFile(storagePath, newFile.buffer, contentType)

    const latestVersion = await Version.findOne({ fileId }).sort({
        versionNumber: -1,
    })
    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

    const version = await Version.create({
        fileId,
        versionNumber: newVersionNumber,
        name: newFile.originalname,
        type: ext.replace('.', ''),
        size: newFile.size,
        storagePath,
        uploadedBy: userId,
    })

    // Purge old if > 10 versions
    const allVersions = await Version.find({ fileId }).sort({
        versionNumber: -1,
    })
    if (allVersions.length > 10) {
        const toDelete = allVersions.slice(10)
        for (const v of toDelete) {
            try {
                await storageService.deleteFile(v.storagePath)
            } catch {
                /* skip */
            }
            await Version.deleteOne({ _id: v._id })
        }
    }

    // Update file doc
    file.name = newFile.originalname
    file.type = ext.replace('.', '')
    file.mimeType = contentType
    file.size = newFile.size
    file.storagePath = storagePath
    file.currentVersionId = version._id
    file.checksum = crypto
        .createHash('md5')
        .update(newFile.buffer)
        .digest('hex')
    file.syncVersion += 1
    file.lastModifiedBy = userId
    await file.save()

    // Update storage
    user.storageUsed += newFile.size
    await user.save()

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'version',
        itemName: file.name,
        metadata: { versionNumber: newVersionNumber },
    })

    return file
}

/**
 * Restore a previous version
 * @param {string} userId
 * @param {string} fileId
 * @param {string} versionId
 * @returns {Promise<Object>}
 */
exports.restoreVersion = async (userId, fileId, versionId) => {
    const file = await File.findOne({ _id: fileId, ownerId: userId })
    if (!file) throw new AppError('File not found', 404)

    const version = await Version.findOne({ _id: versionId, fileId })
    if (!version) throw new AppError('Version not found', 404)

    const latestVersion = await Version.findOne({ fileId }).sort({
        versionNumber: -1,
    })
    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

    const ext = path.extname(version.name)
    const newStoragePath = `${userId}/${file.folderId || 'root'}/${crypto.randomUUID()}${ext}`

    await storageService.copyFile(version.storagePath, newStoragePath)

    await Version.create({
        fileId,
        versionNumber: newVersionNumber,
        name: version.name,
        type: version.type,
        size: version.size,
        storagePath: newStoragePath,
        uploadedBy: userId,
    })

    file.name = version.name
    file.type = version.type
    file.size = version.size
    file.storagePath = newStoragePath
    file.syncVersion += 1
    file.lastModifiedBy = userId
    await file.save()

    await activityService.log({
        userId,
        itemId: file._id,
        itemType: 'file',
        action: 'version',
        itemName: file.name,
        metadata: { restoredVersion: version.versionNumber },
    })

    return file
}

/**
 * Delete a specific version
 * @param {string} userId
 * @param {string} fileId
 * @param {string} versionId
 * @returns {Promise<void>}
 */
exports.deleteVersion = async (userId, fileId, versionId) => {
    const file = await File.findOne({ _id: fileId, ownerId: userId })
    if (!file) throw new AppError('File not found', 404)

    const version = await Version.findOne({ _id: versionId, fileId })
    if (!version) throw new AppError('Version not found', 404)

    // Don't delete current version
    if (file.currentVersionId?.toString() === versionId) {
        throw new AppError('Cannot delete the current version', 400)
    }

    try {
        await storageService.deleteFile(version.storagePath)
    } catch {
        /* skip */
    }
    await Version.deleteOne({ _id: versionId })

    // Decrement storage
    const user = await User.findById(userId)
    user.storageUsed = Math.max(0, user.storageUsed - version.size)
    await user.save()
}

/**
 * Get versions for a file
 * @param {string} userId
 * @param {string} fileId
 * @returns {Promise<Array>}
 */
exports.getVersions = async (userId, fileId) => {
    const file = await File.findOne({ _id: fileId, ownerId: userId })
    if (!file) throw new AppError('File not found', 404)

    return Version.find({ fileId })
        .sort({ versionNumber: -1 })
        .populate('uploadedBy', 'name email')
}

/**
 * Initialize direct upload (signed URL)
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
exports.initUpload = async (
    userId,
    { fileName, fileType, folderId, fileSize }
) => {
    if (folderId) {
        const folder = await Folder.findOne({
            _id: folderId,
            ownerId: userId,
            isDeleted: false,
        })
        if (!folder) throw new AppError('Folder not found', 404)
    }

    // Check quota
    if (fileSize) {
        const user = await User.findById(userId)
        if (user.storageUsed + fileSize > user.storageLimit) {
            throw new AppError('Storage quota exceeded', 403)
        }
    }

    const ext = path.extname(fileName)
    const uniqueName = `${crypto.randomUUID()}${ext}`
    const storagePath = folderId
        ? `${userId}/${folderId}/${uniqueName}`
        : `${userId}/root/${uniqueName}`

    const contentType =
        fileType || mime.lookup(fileName) || 'application/octet-stream'
    const uploadUrl = await storageService.getUploadUrl(
        storagePath,
        contentType
    )

    return { uploadUrl, storagePath, contentType }
}

/**
 * Complete a direct upload
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
exports.completeUpload = async (
    userId,
    { storagePath, fileName, fileSize, folderId, clientId, checksum }
) => {
    const ext = path.extname(fileName)
    const contentType = mime.lookup(fileName) || 'application/octet-stream'

    const fileDoc = await File.create({
        clientId,
        ownerId: userId,
        folderId: folderId || null,
        name: fileName,
        displayName: fileName,
        mimeType: contentType,
        type: ext.replace('.', ''),
        size: fileSize || 0,
        storagePath,
        checksum,
        lastModifiedBy: userId,
    })

    const version = await Version.create({
        fileId: fileDoc._id,
        versionNumber: 1,
        name: fileName,
        type: ext.replace('.', ''),
        size: fileSize || 0,
        storagePath,
        uploadedBy: userId,
    })

    fileDoc.currentVersionId = version._id
    await fileDoc.save()

    // Update storage
    if (fileSize) {
        const user = await User.findById(userId)
        user.storageUsed += fileSize
        await user.save()
    }

    await activityService.log({
        userId,
        itemId: fileDoc._id,
        itemType: 'file',
        action: 'upload',
        itemName: fileName,
        metadata: { name: fileName, size: fileSize },
    })

    return fileDoc
}
