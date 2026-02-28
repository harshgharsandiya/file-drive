const multer = require('multer')

// Store files in memory buffer (they get uploaded to R2)
const storage = multer.memoryStorage()

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
})

module.exports = upload
