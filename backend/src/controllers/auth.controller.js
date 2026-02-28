const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const constants = require('../config/constants')
const User = require('../models/user.model')
const otpService = require('../services/otp.service')
const emailService = require('../services/email.service')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    const existing = await User.findOne({ email })
    if (existing) throw new AppError('Email already exists', 400)

    const hashedPassword = await bcrypt.hash(password, 12)
    const { otp, hashedOtp, expiresAt } = await otpService.generateOtp()

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp: hashedOtp,
        otpExpiresAt: expiresAt,
        isVerified: false,
    })

    console.log(otp)

    // await emailService.sendOtpEmail(email, otp)

    success(
        res,
        { userId: user._id },
        'Registered successfully. Verify email using OTP.',
        201
    )
})

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) throw new AppError('Invalid credentials', 401)

    if (user.isDeleted) throw new AppError('Account has been deactivated', 403)

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new AppError('Invalid credentials', 401)

    if (!user.isVerified)
        throw new AppError('Please verify your email first', 403)

    user.lastLoginAt = new Date()
    await user.save()

    const token = generateToken(user._id)

    success(
        res,
        {
            accessToken: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                preferences: user.preferences,
            },
        },
        'Login successful'
    )
})

exports.logout = asyncHandler(async (req, res) => {
    success(res, null, 'Logged out successfully')
})

exports.verifyOtp = asyncHandler(async (req, res) => {
    const { userId, otp } = req.body

    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404)

    if (user.otpExpiresAt < Date.now()) throw new AppError('OTP expired', 400)

    const isValid = await otpService.verifyOtp(otp, user.otp)
    if (!isValid) throw new AppError('Invalid OTP', 400)

    user.otp = null
    user.otpExpiresAt = null
    user.isVerified = true
    user.lastLoginAt = new Date()
    await user.save()

    const token = generateToken(user._id)

    success(res, { accessToken: token }, 'OTP verified successfully')
})

exports.resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) throw new AppError('User not found', 404)
    if (user.isVerified) throw new AppError('User already verified', 400)

    const { otp, hashedOtp, expiresAt } = await otpService.generateOtp()
    user.otp = hashedOtp
    user.otpExpiresAt = expiresAt
    await user.save()

    await emailService.sendOtpEmail(email, otp)

    success(res, null, 'OTP resent successfully')
})

exports.me = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select(
        '-password -otp -otpExpiry -otpExpiresAt'
    )
    if (!user) throw new AppError('User not found', 404)
    success(res, user)
})

const generateToken = (userId) => {
    return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
        expiresIn: constants.JWT.ACCESS_TOKEN_EXPIRY,
    })
}
