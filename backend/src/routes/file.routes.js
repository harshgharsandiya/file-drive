const express = require('express')
const { body, param, query } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const { requirePermission } = require('../middlewares/rbac.middleware')
const c = require('../controllers/file.controller')

const router = express.Router()

const mongoId = (field) =>
    param(field).isMongoId().withMessage(`Invalid ${field}`)

// Upload (owner only — uploading always belongs to the user)
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

// List queries (own files only — no RBAC needed)
router.get('/recent', auth, c.getRecentFiles)
router.get('/starred', auth, c.getStarredFiles)
router.get('/type/:category', auth, c.getFilesByType)

// ─── File operations ────────────────────────────────────────────────────────

// Get file info — accessible to anyone with at least 'view' permission
router.get(
    '/:fileId',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('view'),
    c.getFile
)

// Delete — owner only
router.delete(
    '/:fileId',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('owner'),
    c.deleteFile
)

// Rename — requires 'edit' permission (owners or edit-share users)
router.patch(
    '/:fileId/rename',
    auth,
    [
        mongoId('fileId'),
        body('name').trim().notEmpty().withMessage('Name is required'),
    ],
    validate,
    requirePermission('edit'),
    c.renameFile
)

// Move — owner only
router.patch(
    '/:fileId/move',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('owner'),
    c.moveFile
)

// Star — requires 'edit' permission
router.patch(
    '/:fileId/star',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('edit'),
    c.toggleStar
)

// Duplicate — requires 'edit' permission
router.post(
    '/:fileId/duplicate',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('edit'),
    c.duplicateFile
)

// Description — requires 'edit' permission
router.patch(
    '/:fileId/description',
    auth,
    [mongoId('fileId'), body('description').isString()],
    validate,
    requirePermission('edit'),
    c.updateDescription
)

// Labels — requires 'edit' permission
router.patch(
    '/:fileId/labels',
    auth,
    [mongoId('fileId'), body('labels').isArray()],
    validate,
    requirePermission('edit'),
    c.updateLabels
)

// Download — accessible to anyone with at least 'view' permission
router.get(
    '/:fileId/download',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('view'),
    c.downloadFile
)

// Preview — accessible to anyone with at least 'view' permission
router.get(
    '/:fileId/preview',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('view'),
    c.previewFile
)

// ─── Versioning ─────────────────────────────────────────────────────────────

// Read versions — 'view' permission
router.get(
    '/:fileId/versions',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('view'),
    c.getVersions
)

// Restore version — owner only
router.post(
    '/:fileId/versions/:versionId/restore',
    auth,
    [mongoId('fileId'), mongoId('versionId')],
    validate,
    requirePermission('owner'),
    c.restoreVersion
)

// Delete version — owner only
router.delete(
    '/:fileId/versions/:versionId',
    auth,
    [mongoId('fileId'), mongoId('versionId')],
    validate,
    requirePermission('owner'),
    c.deleteVersion
)

// Upload new version — 'edit' permission
router.post(
    '/:fileId/upload-version',
    auth,
    [mongoId('fileId')],
    validate,
    requirePermission('edit'),
    upload.single('file'),
    c.uploadNewVersion
)

module.exports = router
