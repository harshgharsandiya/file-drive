const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const { requirePermission } = require('../middlewares/rbac.middleware')
const c = require('../controllers/folder.controller')

const router = express.Router()

const mongoId = (field) =>
    param(field).isMongoId().withMessage(`Invalid ${field}`)
const paginationRules = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['name', 'updatedAt', 'createdAt', 'size']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
]

// Create folder — owner operation
router.post(
    '/',
    auth,
    [body('name').trim().notEmpty().withMessage('Folder name is required')],
    validate,
    c.createFolder
)

// List (own folders only, no RBAC needed)
router.get('/root', auth, paginationRules, validate, c.getRootChildren)
router.get('/tree', auth, c.getFolderTree)

// Read folder children — 'view' permission (shared users can browse)
router.get(
    '/:folderId/children',
    auth,
    [mongoId('folderId'), ...paginationRules],
    validate,
    requirePermission('view', 'folderId'),
    c.getFolderChildren
)

// Get folder path — 'view' permission
router.get(
    '/:folderId/path',
    auth,
    [mongoId('folderId')],
    validate,
    requirePermission('view', 'folderId'),
    c.getFolderPath
)

// Rename — 'edit' permission
router.patch(
    '/:folderId/rename',
    auth,
    [
        mongoId('folderId'),
        body('name').trim().notEmpty().withMessage('Name is required'),
    ],
    validate,
    requirePermission('edit', 'folderId'),
    c.renameFolder
)

// Move — owner only
router.patch(
    '/:folderId/move',
    auth,
    [mongoId('folderId')],
    validate,
    requirePermission('owner', 'folderId'),
    c.moveFolder
)

// Color — 'edit' permission
router.patch(
    '/:folderId/color',
    auth,
    [
        mongoId('folderId'),
        body('color').trim().notEmpty().withMessage('Color is required'),
    ],
    validate,
    requirePermission('edit', 'folderId'),
    c.setColor
)

// Star — 'edit' permission
router.patch(
    '/:folderId/star',
    auth,
    [mongoId('folderId')],
    validate,
    requirePermission('edit', 'folderId'),
    c.toggleStar
)

// Duplicate — 'edit' permission
router.post(
    '/:folderId/duplicate',
    auth,
    [mongoId('folderId')],
    validate,
    requirePermission('edit', 'folderId'),
    c.duplicateFolder
)

// Delete — owner only
router.delete(
    '/:folderId',
    auth,
    [mongoId('folderId')],
    validate,
    requirePermission('owner', 'folderId'),
    c.deleteFolder
)

module.exports = router
