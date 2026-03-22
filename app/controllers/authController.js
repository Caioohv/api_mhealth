const authService = require('../services/authService')

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  async google(req, res, next) {
    try {
      const { idToken } = req.body
      const result = await authService.googleLogin(idToken)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AuthController()
