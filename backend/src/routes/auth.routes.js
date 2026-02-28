const express = require('express')
const { body } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const c = require('../controllers/auth.controller')

const router = express.Router()

router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
    ],
    validate,
    c.register
)

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    c.login
)

router.post('/logout', auth, c.logout)

router.post(
    '/verify-otp',
    [
        body('userId').notEmpty().withMessage('userId is required'),
        body('otp').notEmpty().withMessage('OTP is required'),
    ],
    validate,
    c.verifyOtp
)

router.post(
    '/resend-otp',
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
    ],
    validate,
    c.resendOtp
)

router.get('/me', auth, c.me)

module.exports = router
