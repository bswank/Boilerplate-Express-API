const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session)
const expressValidator = require('express-validator')
const errorHandlers = require('./handlers/errorHandlers')

require('./models/User')

const passport = require('passport')
const routes = require('./routes/routes')

require('./handlers/passport')

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(cookieParser())

app.use(session({
  secret: 'keyboard',
  key: 'warrior',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(routes)

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound)

// One of our error handlers will see if these errors are just validation errors
app.use(errorHandlers.flashValidationErrors)

// Otherwise this was a really bad error we didn't expect! Shoot eh
app.use(errorHandlers.developmentErrors)

// production error handler
// app.use(errorHandlers.productionErrors)

const db = mongoose.connect('mongodb://root:root@ds127883.mlab.com:27883/graphql', { useMongoClient: true })

app.listen(4000, () => {
  console.info('⚡️  Express server started on port 4000.\n')
})

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.info('⚡  Database connection OK\n')
})
