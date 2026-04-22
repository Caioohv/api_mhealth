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



  // Print current process.env to terminal
  app.get('/api/dev/env', (req, res) => {
    console.log('[ENV]', process.env)
    res.json({ ok: true })
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


}
