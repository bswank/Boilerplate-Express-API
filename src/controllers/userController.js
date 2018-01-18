const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('firstName')
  req.sanitizeBody('lastName')
  req.checkBody('firstName', 'Validation Middleware: Name is required.').notEmpty()
  req.checkBody('lastName', 'Validation Middleware: Name is required.').notEmpty()
  req.checkBody('email', 'Validation Middleware: Email is required.').notEmpty()
  req.checkBody('email', 'Validation Middleware: Email must be valid.').isEmail()
  req.sanitizeBody('email').normalizeEmail()
  req.checkBody('password', 'Validation Middleware: Password is required.').notEmpty()
  req.checkBody('password-confirm', 'Validation Middleware: Password Confirmation is required.').notEmpty()
  req.checkBody('password-confirm', 'Validation Middleware: Passwords must match.').equals(req.body.password)

  const errors = req.validationErrors()
  if (errors) {
    return res.send({
      error: errors.map(err => err.msg)
    })
  }

  next()
}

exports.register = async (req, res, next) => {
  const user = await new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  })
  // This is the passport-local-mongoose register method and it's replacing .save() – but, we're promisifying it because it's a callback-based method
  const register = promisify(User.register, User) // Second argument is needed because when you promisify a method, you need to tell it what to bind to; it's bound to User
  await register(user, req.body.password)

  next()
}

exports.edit = async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    req.body,
    {
      new: true,
      runValidators: true,
      context: 'query'
    }
  )
  res.send(user) // update user in client
}
