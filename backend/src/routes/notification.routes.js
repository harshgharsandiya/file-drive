const express = require('express')
const { param } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const c = require('../controllers/notification.controller')

const router = express.Router()

router.get('/', auth, c.list)
router.get('/unread-count', auth, c.getUnreadCount)
router.patch('/read-all', auth, c.markAllRead)
router.patch(
    '/:notificationId/read',
    auth,
    [param('notificationId').isMongoId()],
    validate,
    c.markRead
)
router.delete(
    '/:notificationId',
    auth,
    [param('notificationId').isMongoId()],
    validate,
    c.remove
)

module.exports = router
