const invitationController = require('../controllers/invitationController')

module.exports = (app) => {
  app.get('/api/invitations/:token', invitationController.findByToken)
  app.post('/api/invitations/:token/accept', invitationController.accept)
  app.post('/api/invitations/:token/reject', invitationController.reject)
}
