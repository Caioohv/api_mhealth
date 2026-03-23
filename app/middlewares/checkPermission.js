const prisma = require('../config/prisma')

const checkPermission = (permissionField, requiredLevel = 'VIEW') => {
  const levels = { NONE: 0, VIEW: 1, EDIT: 2 }

  return async (req, res, next) => {
    try {
      const networkId = req.params.id || req.params.networkId
      const userId = req.user.id

      const member = await prisma.networkMember.findUnique({
        where: { userId_networkId: { userId, networkId } },
      })

      if (!member) {
        return res.status(403).json({ error: 'You are not a member of this network' })
      }

      req.membership = member

      if (permissionField && levels[member[permissionField]] < levels[requiredLevel]) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = checkPermission
