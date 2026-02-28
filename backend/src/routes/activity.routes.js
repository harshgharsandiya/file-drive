const express = require('express')
const { param } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const c = require('../controllers/activity.controller')

const router = express.Router()

router.get('/', auth, c.getActivities)
router.get(
    '/:fileId',
    auth,
    [param('fileId').isMongoId()],
    validate,
    c.getFileActivities
)

module.exports = router
