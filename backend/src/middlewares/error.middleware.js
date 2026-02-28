const AppError = require('../utils/AppError')

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500
    let message = err.message || 'Internal Server Error'

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400
        const messages = Object.values(err.errors).map((e) => e.message)
        message = messages.join(', ')
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 409
        const field = Object.keys(err.keyValue).join(', ')
        message = `Duplicate value for: ${field}`
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400
        message = `Invalid ${err.path}: ${err.value}`
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401
        message = 'Invalid token'
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401
        message = 'Token expired'
    }

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err)
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    })
}

module.exports = errorHandler
