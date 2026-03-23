const invitationController = require('../controllers/invitationController')

module.exports = (app) => {
  app.get('/api/invitations/:token', invitationController.findByToken)
}
