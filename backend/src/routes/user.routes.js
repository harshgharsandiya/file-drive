const express = require('express')
const { body } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const c = require('../controllers/user.controller')

const router = express.Router()

router.get('/profile', auth, c.getProfile)
router.patch(
    '/profile',
    auth,
    [
        body('name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Name cannot be empty'),
    ],
    validate,
    c.updateProfile
)

router.post('/avatar', auth, upload.single('avatar'), c.uploadAvatar)

router.post(
    '/change-password',
    auth,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
    ],
    validate,
    c.changePassword
)

router.patch('/preferences', auth, c.updatePreferences)
router.get('/storage', auth, c.getStorageBreakdown)

router.post(
    '/delete-account',
    auth,
    [body('password').notEmpty().withMessage('Password is required')],
    validate,
    c.deleteAccount
)

module.exports = router
