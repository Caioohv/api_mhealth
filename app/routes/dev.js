const prisma = require('../config/prisma')
const authService = require('../services/authService')
const networkService = require('../services/networkService')
const invitationService = require('../services/invitationService')

module.exports = (app) => {
  // List all users
  app.get('/api/dev/users', async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
      })
      res.json(users)
    } catch (error) {
      next(error)
    }
  })

  // Register with fixed password
  app.post('/api/dev/register', async (req, res, next) => {
    try {
      const { name, email } = req.body
      const result = await authService.register({
        name,
        email,
        password: 'senha1'
      })
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  })

  // Login with fixed password
  app.post('/api/dev/login', async (req, res, next) => {
    try {
      const { email } = req.body
      const result = await authService.login(email, 'senha1')
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  // Get user networks, members and permissions
  app.get('/api/dev/networks/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params
      const networks = await networkService.findAllByUser(userId)
      
      // Enrich with members and permissions for each network
      const detailedNetworks = await Promise.all(networks.map(async (n) => {
        const details = await networkService.findById(n.id, userId)
        return {
          ...n,
          members: details.members
        }
      }))
      
      res.json(detailedNetworks)
    } catch (error) {
      next(error)
    }
  })

  // Create network
  app.post('/api/dev/networks', async (req, res, next) => {
    try {
      const { userId, name, description } = req.body
      const network = await networkService.create(userId, { name, description })
      res.status(201).json(network)
    } catch (error) {
      next(error)
    }
  })

  // Invite someone
  app.post('/api/dev/invite', async (req, res, next) => {
    try {
      const { 
        networkId, 
        inviterId, 
        invitedEmail, 
        proposedRole,
        medicationAccess,
        consultationAccess,
        networkAccess,
        recordsAccess 
      } = req.body

      const invitation = await invitationService.create(networkId, inviterId, {
        invitedEmail,
        proposedRole: proposedRole || 'RESPONSAVEL',
        medicationAccess: medicationAccess || 'VIEW',
        consultationAccess: consultationAccess || 'VIEW',
        networkAccess: networkAccess || 'VIEW',
        recordsAccess: recordsAccess || 'VIEW'
      })
      res.status(201).json(invitation)
    } catch (error) {
      next(error)
    }
  })

  // Get invites for email
  app.get('/api/dev/invites/:email', async (req, res, next) => {
    try {
      const { email } = req.params
      const invites = await prisma.invitation.findMany({
        where: { invitedEmail: email, status: 'PENDING' },
        include: {
          network: { select: { id: true, name: true } },
          inviter: { select: { id: true, name: true } }
        }
      })
      res.json(invites)
    } catch (error) {
      next(error)
    }
  })

  // Accept invite (shortcut for testing)
  app.post('/api/dev/accept-invite', async (req, res, next) => {
    try {
      const { token, userId } = req.body
      const member = await invitationService.accept(token, userId)
      res.json(member)
    } catch (error) {
      next(error)
    }
  })
}
