const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const c = require('../controllers/file.controller')

const router = express.Router()

const mongoId = (field) =>
    param(field).isMongoId().withMessage(`Invalid ${field}`)

// Upload
router.post('/upload', auth, upload.single('file'), c.uploadFile)
router.post(
    '/upload/init',
    auth,
    [body('fileName').trim().notEmpty().withMessage('fileName is required')],
    validate,
    c.initUpload
)
router.post(
    '/upload/complete',
    auth,
    [
        body('storagePath').notEmpty().withMessage('storagePath is required'),
        body('fileName').notEmpty().withMessage('fileName is required'),
    ],
    validate,
    c.completeUpload
)

// List queries
router.get('/recent', auth, c.getRecentFiles)
router.get('/starred', auth, c.getStarredFiles)
router.get('/type/:category', auth, c.getFilesByType)

// File operations
router.get('/:fileId', auth, [mongoId('fileId')], validate, c.getFile)
router.delete('/:fileId', auth, [mongoId('fileId')], validate, c.deleteFile)

router.patch(
    '/:fileId/rename',
    auth,
    [
        mongoId('fileId'),
        body('name').trim().notEmpty().withMessage('Name is required'),
    ],
    validate,
    c.renameFile
)

router.patch('/:fileId/move', auth, [mongoId('fileId')], validate, c.moveFile)
router.patch('/:fileId/star', auth, [mongoId('fileId')], validate, c.toggleStar)
router.post(
    '/:fileId/duplicate',
    auth,
    [mongoId('fileId')],
    validate,
    c.duplicateFile
)

router.patch(
    '/:fileId/description',
    auth,
    [mongoId('fileId'), body('description').isString()],
    validate,
    c.updateDescription
)

router.patch(
    '/:fileId/labels',
    auth,
    [mongoId('fileId'), body('labels').isArray()],
    validate,
    c.updateLabels
)

// Download & Preview
router.get(
    '/:fileId/download',
    auth,
    [mongoId('fileId')],
    validate,
    c.downloadFile
)
router.get(
    '/:fileId/preview',
    auth,
    [mongoId('fileId')],
    validate,
    c.previewFile
)

// Versioning
router.get(
    '/:fileId/versions',
    auth,
    [mongoId('fileId')],
    validate,
    c.getVersions
)
router.post(
    '/:fileId/versions/:versionId/restore',
    auth,
    [mongoId('fileId'), mongoId('versionId')],
    validate,
    c.restoreVersion
)
router.delete(
    '/:fileId/versions/:versionId',
    auth,
    [mongoId('fileId'), mongoId('versionId')],
    validate,
    c.deleteVersion
)
router.post(
    '/:fileId/upload-version',
    auth,
    [mongoId('fileId')],
    validate,
    upload.single('file'),
    c.uploadNewVersion
)

module.exports = router
