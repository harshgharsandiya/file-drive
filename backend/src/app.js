const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')

const errorHandler = require('./middlewares/error.middleware')

const authRoutes = require('./routes/auth.routes')
const folderRoutes = require('./routes/folder.routes')
const fileRoutes = require('./routes/file.routes')
const shareRoutes = require('./routes/share.routes')
const searchRoutes = require('./routes/search.routes')
const trashRoutes = require('./routes/trash.routes')
const activityRoutes = require('./routes/activity.routes')
const notificationRoutes = require('./routes/notification.routes')
const userRoutes = require('./routes/user.routes')

const app = express()

// Security
app.use(helmet())
app.use(compression())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

// Rate limiting on auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many requests, try again later' },
})
app.use('/api/users/login', authLimiter)
app.use('/api/users/register', authLimiter)

// Routes
app.use('/api/users', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/folders', folderRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/shares', shareRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/trash', trashRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'OK', uptime: process.uptime() })
})

app.get('/', (req, res) => {
    res.json({ message: 'File drive backend', status: 'OK' })
})

// Global error handler
app.use(errorHandler)

module.exports = app
