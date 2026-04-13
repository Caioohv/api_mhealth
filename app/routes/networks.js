const networkController = require('../controllers/networkController')
const memberController = require('../controllers/memberController')
const invitationController = require('../controllers/invitationController')
const habitController = require('../controllers/habitController')
const emergencyController = require('../controllers/emergencyController')
const checkPermission = require('../middlewares/checkPermission')
const validate = require('../middlewares/validate')
const { networkSchema } = require('../validators/network')
const { createInvitationSchema } = require('../validators/invitation')

module.exports = (app) => {
  app.post('/api/networks', validate(networkSchema), networkController.create)
  app.get('/api/networks', networkController.findAll)
  app.get('/api/networks/:id', networkController.findOne)
  app.get('/api/networks/:id/permissions', checkPermission(), memberController.getMyPermissions)
  app.patch('/api/networks/:id', validate(networkSchema), networkController.update)
  app.delete('/api/networks/:id', networkController.remove)

  app.get('/api/networks/:id/members', checkPermission('networkAccess', 'VIEW'), memberController.findAll)
  app.patch('/api/networks/:id/members/:memberId', checkPermission('networkAccess', 'EDIT'), memberController.update)
  app.delete('/api/networks/:id/members/:memberId', checkPermission('networkAccess', 'EDIT'), memberController.remove)

  app.post('/api/networks/:id/invitations', checkPermission('networkAccess', 'EDIT'), validate(createInvitationSchema), invitationController.create)
  app.delete('/api/invitations/:id', invitationController.cancel)

  // Habits (also available in habits.js, but following the nested pattern too)
  app.post('/api/networks/:id/habits', checkPermission('recordsAccess', 'EDIT'), habitController.create)
  app.get('/api/networks/:id/habits', checkPermission('recordsAccess', 'VIEW'), habitController.listByNetwork)

  // Emergency (Manual SOS)
  app.post('/api/networks/:id/emergency', emergencyController.trigger)
  app.get('/api/networks/:id/emergency', checkPermission('networkAccess', 'VIEW'), emergencyController.listByNetwork)
}

