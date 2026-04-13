const morgan = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')

const privateRoutes = require('../routes/private')
const publicRoutes = require('../routes/public')
const authRoutes = require('../routes/auth')
const userRoutes = require('../routes/users')
const networkRoutes = require('../routes/networks')
const invitationRoutes = require('../routes/invitations')
const medicationRoutes = require('../routes/medications')
const consultationRoutes = require('../routes/consultations')
const occurrenceRoutes = require('../routes/occurrences')
const habitRoutes = require('../routes/habits')
const emergencyRoutes = require('../routes/emergency')
const monitoringRoutes = require('../routes/monitoring')
const devRoutes = require('../routes/dev')

const limiter = require('../middlewares/rateLimiter')
const errorMiddleware = require('../middlewares/errorMiddleware')
const authMiddleware = require('../middlewares/authMiddleware')
const devMode = require('../middlewares/devMode')

morgan.token('statusColor', (req, res, args) => {
  var status = (typeof res.headersSent !== 'boolean' ? Boolean(res.header) : res.headersSent)
    ? res.statusCode
    : undefined

  var color = status >= 500 ? 31 // red
    : status >= 400 ? 33 // yellow
      : status >= 300 ? 36 // cyan
        : status >= 200 ? 32 // green
          : 0 // no color

  return '\x1b[' + color + 'm' + status + '\x1b[0m'
})

module.exports = (app) => {

  console.log('Booting Server...')

  app.set('view cache', false)
  app.use(bodyParser.json({limit: '20mb'}))
  app.use(bodyParser.urlencoded({extended: true}))

  app.use(morgan('\x1b[33m:method\x1b[0m \x1b[36m:url\x1b[0m :statusColor :response-time ms'))

  app.use(cors())
  
  // Rate limiting global
  app.use(limiter)

  // -- PUBLIC ROUTES --
  authRoutes(app)
  publicRoutes(app)

  // -- DEV ROUTES --
  // We apply devMode middleware ONLY to dev routes and ensure they are before authMiddleware
  app.use('/api/dev', devMode)
  devRoutes(app)

  // -- PRIVATE ROUTES (Protected by authMiddleware) --
  app.use('/api', authMiddleware)
  userRoutes(app)
  networkRoutes(app)
  medicationRoutes(app)
  consultationRoutes(app)
  occurrenceRoutes(app)
  habitRoutes(app)
  emergencyRoutes(app)
  monitoringRoutes(app)
  invitationRoutes(app)
  privateRoutes(app)

  // Middleware global de erro
  app.use(errorMiddleware)
  
  console.log('Server ok')
}
