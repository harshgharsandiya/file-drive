const bcrypt = require('bcrypt')
const User = require('../models/user.model')
const File = require('../models/file.model')
const Folder = require('../models/folder.model')
const AppError = require('../utils/AppError')

/**
 * Get user profile
 * @param {string} userId
 * @returns {Promise<Object>}
 */
exports.getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -otp -otpExpiry')
    if (!user) throw new AppError('User not found', 404)
    return user
}

/**
 * Update user profile fields (name, avatarUrl)
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
exports.updateProfile = async (userId, { name }) => {
    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404)

    if (name) user.name = name
    await user.save()

    return user
}

/**
 * Upload avatar
 * @param {string} userId
 * @param {Object} file - multer file object
 * @returns {Promise<Object>}
 */
exports.uploadAvatar = async (userId, file) => {
    const storageService = require('./storage.service')
    const crypto = require('crypto')

    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404)

    const ext = file.originalname.split('.').pop()
    const key = `${userId}/avatar/${crypto.randomUUID()}.${ext}`
    const contentType = file.mimetype || 'image/jpeg'

    // Optionally resize
    let buffer = file.buffer
    try {
        const sharp = require('sharp')
        buffer = await sharp(file.buffer)
            .resize(256, 256, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer()
    } catch {
        /* use original */
    }

    await storageService.uploadFile(key, buffer, contentType)
    const avatarUrl = await storageService.getDownloadUrl(key, 86400 * 365)

    user.avatarUrl = avatarUrl
    await user.save()

    return user
}

/**
 * Change password
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
exports.changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404)

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) throw new AppError('Current password is incorrect', 401)

    const salt = await bcrypt.genSalt(12)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()
}

/**
 * Update user preferences
 * @param {string} userId
 * @param {Object} preferences
 * @returns {Promise<Object>}
 */
exports.updatePreferences = async (userId, preferences) => {
    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404)

    const allowed = ['viewMode', 'defaultSort', 'itemsPerPage', 'theme']
    for (const key of allowed) {
        if (preferences[key] !== undefined) {
            user.preferences[key] = preferences[key]
        }
    }
    user.markModified('preferences')
    await user.save()

    return user.preferences
}

/**
 * Get storage breakdown by file type category
 * @param {string} userId
 * @returns {Promise<Object>}
 */
exports.getStorageBreakdown = async (userId) => {
    const user = await User.findById(userId).select('storageUsed storageLimit')
    if (!user) throw new AppError('User not found', 404)

    const breakdown = await File.aggregate([
        { $match: { ownerId: user._id, isDeleted: false } },
        {
            $group: {
                _id: '$mimeType',
                totalSize: { $sum: '$size' },
                count: { $sum: 1 },
            },
        },
        { $sort: { totalSize: -1 } },
    ])

    // Categorize
    const categories = {
        images: 0,
        videos: 0,
        documents: 0,
        audio: 0,
        archives: 0,
        other: 0,
    }
    const counts = {
        images: 0,
        videos: 0,
        documents: 0,
        audio: 0,
        archives: 0,
        other: 0,
    }

    for (const item of breakdown) {
        const mime = item._id || ''
        if (mime.startsWith('image/')) {
            categories.images += item.totalSize
            counts.images += item.count
        } else if (mime.startsWith('video/')) {
            categories.videos += item.totalSize
            counts.videos += item.count
        } else if (mime.startsWith('audio/')) {
            categories.audio += item.totalSize
            counts.audio += item.count
        } else if (
            mime.includes('zip') ||
            mime.includes('rar') ||
            mime.includes('tar') ||
            mime.includes('7z') ||
            mime.includes('gzip')
        ) {
            categories.archives += item.totalSize
            counts.archives += item.count
        } else if (
            mime.includes('pdf') ||
            mime.includes('document') ||
            mime.includes('word') ||
            mime.includes('sheet') ||
            mime.includes('text') ||
            mime.includes('presentation')
        ) {
            categories.documents += item.totalSize
            counts.documents += item.count
        } else {
            categories.other += item.totalSize
            counts.other += item.count
        }
    }

    const folderCount = await Folder.countDocuments({
        ownerId: userId,
        isDeleted: false,
    })
    const fileCount = await File.countDocuments({
        ownerId: userId,
        isDeleted: false,
    })

    return {
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        percentage: Math.round((user.storageUsed / user.storageLimit) * 100),
        categories,
        counts,
        totalFiles: fileCount,
        totalFolders: folderCount,
    }
}

/**
 * Soft-delete account
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<void>}
 */
exports.deleteAccount = async (userId, password) => {
    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404)

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new AppError('Password is incorrect', 401)

    user.isDeleted = true
    user.deletedAt = new Date()
    await user.save()
}
