const express = require('express')
const router = express.Router()
const user = require('../controllers/userController')
const auth = require('../controllers/authController')
const { catchErrors } = require('../handlers/errorHandlers')

router.post('/register',
  user.validateRegister,
  user.register,
  auth.login
)

router.post('/login', auth.login)

router.get('/logout', auth.isLoggedIn, auth.logout)

// '/account' is handled by the client since all user data will already be available to the client

router.post('/account/edit', auth.isLoggedIn, catchErrors(user.edit))

router.post('/account/forgot', catchErrors(auth.forgotPassword))

router.get('/account/reset/:token', catchErrors(auth.resetPassword))

router.post('/account/reset/:token',
  auth.confirmPasswordsMatch,
  catchErrors(auth.updatePassword)
)

module.exports = router
