const File = require('../models/file.model')
const Folder = require('../models/folder.model')

/**
 * Full-text search across files and folders
 * @param {string} userId
 * @param {Object} params
 * @returns {Promise<{files: Array, folders: Array, totalFiles: number, totalFolders: number}>}
 */
exports.search = async (
    userId,
    {
        q,
        type,
        dateFrom,
        dateTo,
        minSize,
        maxSize,
        starred,
        page = 1,
        limit = 50,
    }
) => {
    const skip = (page - 1) * limit

    // -- File query --
    const fileQuery = { ownerId: userId, isDeleted: false }
    const folderQuery = { ownerId: userId, isDeleted: false }

    // Text search
    if (q) {
        fileQuery.$text = { $search: q }
        folderQuery.$text = { $search: q }
    }

    // Type filter (file extension)
    if (type) {
        const types = type.split(',').map((t) => t.trim().toLowerCase())
        fileQuery.type = { $in: types }
    }

    // Date range
    if (dateFrom || dateTo) {
        fileQuery.updatedAt = {}
        folderQuery.updatedAt = {}
        if (dateFrom) {
            fileQuery.updatedAt.$gte = new Date(dateFrom)
            folderQuery.updatedAt.$gte = new Date(dateFrom)
        }
        if (dateTo) {
            fileQuery.updatedAt.$lte = new Date(dateTo)
            folderQuery.updatedAt.$lte = new Date(dateTo)
        }
    }

    // Size filter (files only)
    if (minSize || maxSize) {
        fileQuery.size = {}
        if (minSize) fileQuery.size.$gte = Number(minSize)
        if (maxSize) fileQuery.size.$lte = Number(maxSize)
    }

    // Starred filter
    if (starred === 'true' || starred === true) {
        fileQuery.isStarred = true
        folderQuery.isStarred = true
    }

    // Sort: text score if searching, otherwise by updatedAt
    const fileSort = q ? { score: { $meta: 'textScore' } } : { updatedAt: -1 }
    const folderSort = q ? { score: { $meta: 'textScore' } } : { updatedAt: -1 }

    const fileProjection = q ? { score: { $meta: 'textScore' } } : {}
    const folderProjection = q ? { score: { $meta: 'textScore' } } : {}

    const [files, totalFiles, folders, totalFolders] = await Promise.all([
        File.find(fileQuery, fileProjection)
            .sort(fileSort)
            .skip(skip)
            .limit(limit),
        File.countDocuments(fileQuery),
        Folder.find(folderQuery, folderProjection)
            .sort(folderSort)
            .skip(skip)
            .limit(limit),
        Folder.countDocuments(folderQuery),
    ])

    return { files, folders, totalFiles, totalFolders }
}

/**
 * Search suggestions based on recent files and name prefix
 * @param {string} userId
 * @param {string} q - partial query
 * @returns {Promise<Array>}
 */
exports.suggest = async (userId, q) => {
    if (!q || q.length < 2) return []

    const regex = new RegExp(q, 'i')

    const [files, folders] = await Promise.all([
        File.find({ ownerId: userId, isDeleted: false, name: regex })
            .select('name type mimeType')
            .limit(5)
            .sort({ updatedAt: -1 }),
        Folder.find({ ownerId: userId, isDeleted: false, name: regex })
            .select('name')
            .limit(3)
            .sort({ updatedAt: -1 }),
    ])

    const suggestions = [
        ...files.map((f) => ({
            id: f._id,
            name: f.name,
            type: 'file',
            fileType: f.type,
        })),
        ...folders.map((f) => ({ id: f._id, name: f.name, type: 'folder' })),
    ]

    return suggestions
}
