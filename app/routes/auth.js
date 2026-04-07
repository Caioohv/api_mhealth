const authController = require('../controllers/authController')
const validate = require('../middlewares/validate')
const { registerSchema, loginSchema, googleSchema } = require('../validators/auth')

module.exports = (app) => {
  app.post('/auth/register', validate(registerSchema), authController.register)
  app.post('/auth/login', validate(loginSchema), authController.login)
  app.post('/auth/google', validate(googleSchema), authController.google)
}
