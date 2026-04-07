const userController = require('../controllers/userController')

module.exports = (app) => {
  app.get('/api/users/me', userController.getMe)
  app.patch('/api/users/me', userController.updateMe)
}
