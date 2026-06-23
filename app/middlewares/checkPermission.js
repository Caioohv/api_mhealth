const prisma = require('../config/prisma')

const checkPermission = (permissionField, requiredLevel = 'VIEW', options = {}) => {
  const levels = { NONE: 0, VIEW: 1, EDIT: 2 }

  return async (req, res, next) => {
    try {
      const rawNetworkId = req.params.id || req.params.networkId
      const networkId = options.resolveNetworkId
        ? await options.resolveNetworkId(req)
        : rawNetworkId
      const userId = req.user.id

      const member = await prisma.networkMember.findUnique({
        where: { userId_networkId: { userId, networkId } },
      })

      if (!member) {
        return res.status(403).json({ error: 'You are not a member of this network' })
      }

      req.membership = member

      if (options.allowRoles && options.allowRoles.includes(member.role)) {
        return next()
      }

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
