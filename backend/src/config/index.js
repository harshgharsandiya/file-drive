/**
 * Centralized environment configuration with validation.
 * Import this module instead of reading process.env directly.
 */

const requiredVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
]

const missing = requiredVars.filter((v) => !process.env[v])
if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    console.error(`Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
}

module.exports = {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    mongo: {
        uri: process.env.MONGO_URI,
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '7d',
    },

    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    supabase: {
        url: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        bucketName: process.env.SUPABASE_BUCKET_NAME || 'filedrive',
    },

    storage: {
        defaultLimit: 15 * 1024 * 1024 * 1024, // 15 GB in bytes
        maxFileSize: 100 * 1024 * 1024, // 100 MB
    },

    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
    },

    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
}
