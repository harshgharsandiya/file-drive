const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
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

router.post(
    '/',
    auth,
    [body('name').trim().notEmpty().withMessage('Folder name is required')],
    validate,
    c.createFolder
)

router.get('/root', auth, paginationRules, validate, c.getRootChildren)
router.get('/tree', auth, c.getFolderTree)

router.get(
    '/:folderId/children',
    auth,
    [mongoId('folderId'), ...paginationRules],
    validate,
    c.getFolderChildren
)
router.get(
    '/:folderId/path',
    auth,
    [mongoId('folderId')],
    validate,
    c.getFolderPath
)

router.patch(
    '/:folderId/rename',
    auth,
    [
        mongoId('folderId'),
        body('name').trim().notEmpty().withMessage('Name is required'),
    ],
    validate,
    c.renameFolder
)

router.patch(
    '/:folderId/move',
    auth,
    [mongoId('folderId')],
    validate,
    c.moveFolder
)

router.patch(
    '/:folderId/color',
    auth,
    [
        mongoId('folderId'),
        body('color').trim().notEmpty().withMessage('Color is required'),
    ],
    validate,
    c.setColor
)

router.patch(
    '/:folderId/star',
    auth,
    [mongoId('folderId')],
    validate,
    c.toggleStar
)
router.post(
    '/:folderId/duplicate',
    auth,
    [mongoId('folderId')],
    validate,
    c.duplicateFolder
)
router.delete(
    '/:folderId',
    auth,
    [mongoId('folderId')],
    validate,
    c.deleteFolder
)

module.exports = router
