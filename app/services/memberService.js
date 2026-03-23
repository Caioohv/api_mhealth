const prisma = require('../config/prisma')

const MEMBER_SELECT = {
  id: true,
  userId: true,
  role: true,
  joinedAt: true,
  medicationAccess: true,
  consultationAccess: true,
  networkAccess: true,
  recordsAccess: true,
  alertLevel: true,
  user: {
    select: { id: true, name: true, email: true, phone: true },
  },
}

const VALID_PERMISSION_LEVELS = ['NONE', 'VIEW', 'EDIT']
const VALID_ROLES = ['RESPONSAVEL', 'ASSISTIDO']
const VALID_ALERT_LEVELS = ['ALL', 'EMERGENCY_ONLY', 'NONE']

class MemberService {
  async findAll(networkId) {
    return prisma.networkMember.findMany({
      where: { networkId },
      select: MEMBER_SELECT,
    })
  }

  async update(networkId, memberId, userId, data) {
    const target = await prisma.networkMember.findFirst({
      where: { id: memberId, networkId },
      include: { network: { select: { creatorId: true } } },
    })

    if (!target) {
      const error = new Error('Member not found')
      error.statusCode = 404
      throw error
    }

    if (target.network.creatorId === target.userId && data.role) {
      const error = new Error('Cannot change the role of the network creator')
      error.statusCode = 400
      throw error
    }

    const updateData = {}

    if (data.role !== undefined) {
      if (!VALID_ROLES.includes(data.role)) {
        const error = new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`)
        error.statusCode = 400
        throw error
      }
      updateData.role = data.role
    }

    const permFields = ['medicationAccess', 'consultationAccess', 'networkAccess', 'recordsAccess']
    for (const field of permFields) {
      if (data[field] !== undefined) {
        if (!VALID_PERMISSION_LEVELS.includes(data[field])) {
          const error = new Error(`Invalid ${field}. Must be one of: ${VALID_PERMISSION_LEVELS.join(', ')}`)
          error.statusCode = 400
          throw error
        }
        updateData[field] = data[field]
      }
    }

    if (data.alertLevel !== undefined) {
      if (!VALID_ALERT_LEVELS.includes(data.alertLevel)) {
        const error = new Error(`Invalid alertLevel. Must be one of: ${VALID_ALERT_LEVELS.join(', ')}`)
        error.statusCode = 400
        throw error
      }
      updateData.alertLevel = data.alertLevel
    }

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields to update')
      error.statusCode = 400
      throw error
    }

    return prisma.networkMember.update({
      where: { id: memberId },
      data: updateData,
      select: MEMBER_SELECT,
    })
  }

  async remove(networkId, memberId, userId) {
    const target = await prisma.networkMember.findFirst({
      where: { id: memberId, networkId },
      include: { network: { select: { creatorId: true } } },
    })

    if (!target) {
      const error = new Error('Member not found')
      error.statusCode = 404
      throw error
    }

    if (target.network.creatorId === target.userId) {
      const error = new Error('Cannot remove the network creator')
      error.statusCode = 400
      throw error
    }

    await prisma.networkMember.delete({ where: { id: memberId } })
  }
}

module.exports = new MemberService()
