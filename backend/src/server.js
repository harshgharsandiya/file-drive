require('dotenv').config()

const app = require('./app')
const connectDB = require('./config/db')
const cron = require('node-cron')

connectDB()

// Cron: auto-delete expired trash items every day at 2 AM
cron.schedule('0 2 * * *', async () => {
    try {
        const trashService = require('./services/trash.service')
        const count = await trashService.autoDeleteExpired()
        if (count > 0)
            console.log(`[Cron] Auto-deleted ${count} expired trash items`)
    } catch (err) {
        console.error('[Cron] Trash auto-delete error:', err.message)
    }
})

// Cron: purge old read notifications every day at 3 AM
cron.schedule('0 3 * * *', async () => {
    try {
        const notificationService = require('./services/notification.service')
        const count = await notificationService.purgeOld()
        if (count > 0) console.log(`[Cron] Purged ${count} old notifications`)
    } catch (err) {
        console.error('[Cron] Notification purge error:', err.message)
    }
})

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
)

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`)
    server.close(() => {
        console.log('Server closed')
        process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
