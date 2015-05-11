let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let mongoose = require('mongoose')
let nodeifyit = require('nodeifyit')
let flash = require('connect-flash')

let dateformat = require('dateformat')

let passportMiddleware = require('./middleware/passport')
let routes = require('./routes')


require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000




// Add in-memory user before app.listen()
// let user = {
//     email: 'foo@foo.com',
//     password: bcrypt.hashSync('111111', SALT)
// }

let app = express()

app.passport = passport

app.use(morgan('dev'))

// And add the following just before app.listen
// Use ejs for templating, with the default directory /views
app.set('view engine', 'ejs')



// Read cookies, required for sessions
app.use(cookieParser('ilovethenodejs'))            
// Get POST/PUT body information (e.g., from html forms like login)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// In-memory session support, required by passport.session()
app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))

// Use the passport middleware to enable passport
app.use(passport.initialize())

// Enable passport persistent sessions
app.use(passport.session())

app.use(flash())

passportMiddleware(app)
routes(app)

Date.prototype.format = function(fmt) {
  return dateformat(this, fmt)
}

mongoose.connect('mongodb://127.0.0.1:27017/blogger-starter')

// start server 
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))




