const crypto = require('crypto')
const Share = require('../models/share.model')
const File = require('../models/file.model')
const Folder = require('../models/folder.model')
const User = require('../models/user.model')
const notificationService = require('./notification.service')
const activityService = require('./activity.service')
const AppError = require('../utils/AppError')

/**
 * Share an item with a user
 * @param {string} ownerId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
exports.shareWithUser = async (
    ownerId,
    { itemId, itemType, email, permission }
) => {
    // Validate item ownership
    const Model = itemType === 'file' ? File : Folder
    const item = await Model.findOne({ _id: itemId, ownerId, isDeleted: false })
    if (!item) throw new AppError(`${itemType} not found`, 404)

    // Find target user
    const targetUser = await User.findOne({ email, isDeleted: { $ne: true } })
    if (!targetUser) throw new AppError('User with that email not found', 404)
    if (targetUser._id.toString() === ownerId)
        throw new AppError('Cannot share with yourself', 400)

    // Check for existing share
    const existing = await Share.findOne({ itemId, sharedWith: targetUser._id })
    if (existing) {
        existing.permission = permission
        await existing.save()
        return existing
    }

    const share = await Share.create({
        itemId,
        itemType,
        ownerId,
        sharedWith: targetUser._id,
        permission,
    })

    // Notify the target user
    await notificationService.create({
        userId: targetUser._id,
        type: 'file_shared',
        message: `A ${itemType} "${item.name}" has been shared with you`,
        relatedFileId: itemType === 'file' ? itemId : undefined,
        relatedFolderId: itemType === 'folder' ? itemId : undefined,
    })

    await activityService.log({
        userId: ownerId,
        itemId,
        itemType,
        action: 'share',
        itemName: item.name,
        metadata: { sharedWith: email, permission },
    })

    return share
}

/**
 * Create a public share link
 * @param {string} ownerId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
exports.createPublicLink = async (
    ownerId,
    { itemId, itemType, permission, expiresIn }
) => {
    const Model = itemType === 'file' ? File : Folder
    const item = await Model.findOne({ _id: itemId, ownerId, isDeleted: false })
    if (!item) throw new AppError(`${itemType} not found`, 404)

    // Check for existing public link
    let share = await Share.findOne({
        itemId,
        sharedWith: null,
        linkToken: { $ne: null },
    })
    if (share) {
        share.permission = permission || share.permission
        if (expiresIn) share.expiresAt = new Date(Date.now() + expiresIn * 1000)
        await share.save()
        return share
    }

    const linkToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    share = await Share.create({
        itemId,
        itemType,
        ownerId,
        sharedWith: null,
        permission: permission || 'view',
        linkToken,
        expiresAt,
    })

    // Also store public token on the file for quick lookup
    if (itemType === 'file') {
        await File.findByIdAndUpdate(itemId, {
            publicToken: linkToken,
            publicTokenExpiry: expiresAt,
        })
    }

    await activityService.log({
        userId: ownerId,
        itemId,
        itemType,
        action: 'share',
        itemName: item.name,
        metadata: { type: 'public_link' },
    })

    return share
}

/**
 * Revoke a share
 * @param {string} ownerId
 * @param {string} shareId
 * @returns {Promise<void>}
 */
exports.revokeShare = async (ownerId, shareId) => {
    const share = await Share.findOne({ _id: shareId, ownerId })
    if (!share) throw new AppError('Share not found', 404)

    // If public link, clean the file's public token
    if (share.linkToken && share.itemType === 'file') {
        await File.findByIdAndUpdate(share.itemId, {
            publicToken: null,
            publicTokenExpiry: null,
        })
    }

    await Share.deleteOne({ _id: shareId })
}

/**
 * Update share permission
 * @param {string} ownerId
 * @param {string} shareId
 * @param {string} permission
 * @returns {Promise<Object>}
 */
exports.updatePermission = async (ownerId, shareId, permission) => {
    const share = await Share.findOne({ _id: shareId, ownerId })
    if (!share) throw new AppError('Share not found', 404)

    share.permission = permission
    await share.save()
    return share
}

/**
 * Get items shared with a user (paginated)
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<{items: Array, total: number}>}
 */
exports.getSharedWithMe = async (userId, { page = 1, limit = 50 }) => {
    const skip = (page - 1) * limit
    const query = { sharedWith: userId }

    const [shares, total] = await Promise.all([
        Share.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('ownerId', 'name email'),
        Share.countDocuments(query),
    ])

    // Populate items
    const items = []
    for (const share of shares) {
        const Model = share.itemType === 'file' ? File : Folder
        const item = await Model.findById(share.itemId)
        if (item && !item.isDeleted) {
            items.push({
                share: share.toObject(),
                item: item.toObject(),
            })
        }
    }

    return { items, total }
}

/**
 * Get items shared by a user (paginated)
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<{items: Array, total: number}>}
 */
exports.getSharedByMe = async (userId, { page = 1, limit = 50 }) => {
    const skip = (page - 1) * limit
    const query = { ownerId: userId }

    const [shares, total] = await Promise.all([
        Share.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sharedWith', 'name email'),
        Share.countDocuments(query),
    ])

    const items = []
    for (const share of shares) {
        const Model = share.itemType === 'file' ? File : Folder
        const item = await Model.findById(share.itemId)
        if (item) {
            items.push({
                share: share.toObject(),
                item: item.toObject(),
            })
        }
    }

    return { items, total }
}

/**
 * Get shares for a specific item
 * @param {string} ownerId
 * @param {string} itemId
 * @returns {Promise<Array>}
 */
exports.getItemShares = async (ownerId, itemId) => {
    return Share.find({ itemId, ownerId }).populate('sharedWith', 'name email')
}

/**
 * Access a shared link
 * @param {string} token
 * @returns {Promise<Object>}
 */
exports.accessPublicLink = async (token) => {
    const share = await Share.findOne({ linkToken: token }).populate(
        'ownerId',
        'name email'
    )
    if (!share) throw new AppError('Share link not found or invalid', 404)

    if (share.expiresAt && share.expiresAt < new Date()) {
        throw new AppError('Share link has expired', 410)
    }

    const Model = share.itemType === 'file' ? File : Folder
    const item = await Model.findById(share.itemId)
    if (!item || item.isDeleted)
        throw new AppError('Shared item no longer exists', 404)

    return {
        share: share.toObject(),
        item: item.toObject(),
    }
}
