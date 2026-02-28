const bcrypt = require('bcrypt')

const OTP_EXPIRES_MINUTES = require('../config/constants').OTP.OTP_EXPIRES

exports.generateOtp = async () => {
    const otp = Math.floor(1_00_000 + Math.random() * 9_00_000).toString()
    const hashedOtp = await bcrypt.hash(otp, 10)

    return {
        otp,
        hashedOtp,
        expiresAt: Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000,
    }
}

exports.verifyOtp = async (inputOtp, hashedOtp) => {
    if (!hashedOtp) return false
    return await bcrypt.compare(inputOtp.trim(), hashedOtp)
}
