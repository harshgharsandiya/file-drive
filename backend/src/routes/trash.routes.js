const express = require('express')
const { param } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const c = require('../controllers/trash.controller')

const router = express.Router()

const mongoId = (field) =>
    param(field).isMongoId().withMessage(`Invalid ${field}`)

router.get('/', auth, c.getTrash)
router.post(
    '/:trashId/restore',
    auth,
    [mongoId('trashId')],
    validate,
    c.restoreItem
)
router.delete('/empty', auth, c.emptyTrash)
router.delete(
    '/:trashId',
    auth,
    [mongoId('trashId')],
    validate,
    c.permanentDelete
)

module.exports = router
