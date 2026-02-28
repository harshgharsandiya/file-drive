const express = require('express')
const { query } = require('express-validator')
const validate = require('../middlewares/validate.middleware')
const auth = require('../middlewares/auth.middleware')
const c = require('../controllers/search.controller')

const router = express.Router()

router.get(
    '/',
    auth,
    [query('q').trim().notEmpty().withMessage('Search query is required')],
    validate,
    c.search
)

router.get('/suggest', auth, c.suggest)

module.exports = router
