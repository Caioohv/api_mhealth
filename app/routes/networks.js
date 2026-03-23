const networkController = require('../controllers/networkController')
const memberController = require('../controllers/memberController')
const invitationController = require('../controllers/invitationController')
const checkPermission = require('../middlewares/checkPermission')

module.exports = (app) => {
  app.post('/api/networks', networkController.create)
  app.get('/api/networks', networkController.findAll)
  app.get('/api/networks/:id', networkController.findOne)
  app.patch('/api/networks/:id', networkController.update)
  app.delete('/api/networks/:id', networkController.remove)

  app.get('/api/networks/:id/members', checkPermission('networkAccess', 'VIEW'), memberController.findAll)
  app.patch('/api/networks/:id/members/:memberId', checkPermission('networkAccess', 'EDIT'), memberController.update)
  app.delete('/api/networks/:id/members/:memberId', checkPermission('networkAccess', 'EDIT'), memberController.remove)

  app.post('/api/networks/:id/invitations', checkPermission('networkAccess', 'EDIT'), invitationController.create)
  app.post('/api/invitations/:token/accept', invitationController.accept)
  app.post('/api/invitations/:token/reject', invitationController.reject)
  app.delete('/api/invitations/:id', invitationController.cancel)
}

