const passport = require('passport')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const crypto = require('crypto')
const promisify = require('es6-promisify')

// NOTE: When auth is successful, we'll simply store the user in the Store and set some kind of logged-in variable to true. Look into what the tutorial used the token for and if we can do this without a token.

exports.login = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    res.send('No user with that email address.')
  } else {
    passport.authenticate('local', (err, user) => {
      if (err) {
        return res.send({
          error: err
        })
      }
      if (!user) {
        return res.send('Your password is incorrect.')
      }
      req.logIn(user, function (err) {
        if (err) { return next(err) }
        return res.send(user)
      })
    })(req, res, next)
  }
}

exports.logout = (req, res) => {
  req.logout()
  res.send('Logged out successfully.')
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.status(401).send({
      error: 'Authentication Failed'
    })
  }
}

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.send('User not found notice.')
  }
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 3600000
  await user.save()
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  res.send(`Password reset link (to be emailed): ${resetURL}`)
}

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    return res.send('Password reset token invalid/expired error.')
  }
}

exports.confirmPasswordsMatch = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next()
  }
  res.send('Passwords do not match error.')
}

exports.updatePassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    return res.send('Password reset token invalid/expired error.')
  }
  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  const updatedUser = await user.save()
  await req.login(updatedUser)
  res.send(updatedUser) // update user in client
}
