const userService = require('../services/userService')

class UserController {
  async getMe(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id)
      res.status(200).json(user)
    } catch (error) {
      next(error)
    }
  }

  async updateMe(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body)
      res.status(200).json(user)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserController()
