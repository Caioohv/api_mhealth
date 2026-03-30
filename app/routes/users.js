const userController = require('../controllers/userController')
const devMode = require('../middlewares/devMode')

module.exports = (app) => {
  app.get('/api/users/me', userController.getMe)
  app.patch('/api/users/me', userController.updateMe)
  app.get('/api/users', devMode, userController.getAll)
}
