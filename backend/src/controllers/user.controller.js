const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/response')
const userService = require('../services/user.service')
const AppError = require('../utils/AppError')

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user.id)
    success(res, user)
})

exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user.id, req.body)
    success(res, user, 'Profile updated')
})

exports.uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400)
    const user = await userService.uploadAvatar(req.user.id, req.file)
    success(res, { avatarUrl: user.avatarUrl }, 'Avatar updated')
})

exports.changePassword = asyncHandler(async (req, res) => {
    await userService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
    )
    success(res, null, 'Password changed successfully')
})

exports.updatePreferences = asyncHandler(async (req, res) => {
    const preferences = await userService.updatePreferences(
        req.user.id,
        req.body
    )
    success(res, preferences, 'Preferences updated')
})

exports.getStorageBreakdown = asyncHandler(async (req, res) => {
    const breakdown = await userService.getStorageBreakdown(req.user.id)
    success(res, breakdown)
})

exports.deleteAccount = asyncHandler(async (req, res) => {
    await userService.deleteAccount(req.user.id, req.body.password)
    success(res, null, 'Account deactivated')
})
