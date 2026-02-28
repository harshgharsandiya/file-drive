const express = require('express')
const { body, param } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const c = require('../controllers/share.controller')

const router = express.Router()

const mongoId = (field) =>
    param(field).isMongoId().withMessage(`Invalid ${field}`)

// Share with user
router.post(
    '/user',
    auth,
    [
        body('itemId').isMongoId().withMessage('itemId is required'),
        body('itemType')
            .isIn(['file', 'folder'])
            .withMessage('itemType must be file or folder'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('permission').optional().isIn(['view', 'comment', 'edit']),
    ],
    validate,
    c.shareWithUser
)

// Create public link
router.post(
    '/link',
    auth,
    [
        body('itemId').isMongoId().withMessage('itemId is required'),
        body('itemType')
            .isIn(['file', 'folder'])
            .withMessage('itemType must be file or folder'),
        body('permission').optional().isIn(['view', 'comment', 'edit']),
    ],
    validate,
    c.createPublicLink
)

// Access public link (no auth)
router.get('/link/:token', c.accessPublicLink)

// Shared with me / by me
router.get('/with-me', auth, c.getSharedWithMe)
router.get('/by-me', auth, c.getSharedByMe)

// Shares for an item
router.get(
    '/item/:itemId',
    auth,
    [mongoId('itemId')],
    validate,
    c.getItemShares
)

// Update / revoke
router.patch(
    '/:shareId',
    auth,
    [mongoId('shareId'), body('permission').isIn(['view', 'comment', 'edit'])],
    validate,
    c.updatePermission
)

router.delete('/:shareId', auth, [mongoId('shareId')], validate, c.revokeShare)

module.exports = router
