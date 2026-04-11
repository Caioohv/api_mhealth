const prisma = require('../config/prisma')

const INVITATION_SELECT = {
  id: true,
  token: true,
  status: true,
  proposedRole: true,
  medicationAccess: true,
  consultationAccess: true,
  networkAccess: true,
  recordsAccess: true,
  invitedEmail: true,
  invitedPhone: true,
  createdAt: true,
  expiresAt: true,
  network: { select: { id: true, name: true } },
  inviter: { select: { id: true, name: true } },
}

const VALID_ROLES = ['RESPONSAVEL', 'ASSISTIDO']
const VALID_PERMISSION_LEVELS = ['NONE', 'VIEW', 'EDIT']
const INVITATION_EXPIRY_DAYS = 7

class InvitationService {
  async create(networkId, inviterId, data) {
    const { proposedRole, invitedEmail, invitedPhone } = data

    if (!proposedRole || !VALID_ROLES.includes(proposedRole)) {
      const error = new Error(`proposedRole is required. Must be one of: ${VALID_ROLES.join(', ')}`)
      error.statusCode = 400
      throw error
    }

    const permFields = ['medicationAccess', 'consultationAccess', 'networkAccess', 'recordsAccess']
    const permData = {}
    for (const field of permFields) {
      if (data[field] !== undefined) {
        if (!VALID_PERMISSION_LEVELS.includes(data[field])) {
          const error = new Error(`Invalid ${field}. Must be one of: ${VALID_PERMISSION_LEVELS.join(', ')}`)
          error.statusCode = 400
          throw error
        }
        permData[field] = data[field]
      }
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

    const invitation = await prisma.invitation.create({
      data: {
        networkId,
        inviterId,
        invitedEmail: invitedEmail || null,
        invitedPhone: invitedPhone || null,
        proposedRole,
        expiresAt,
        ...permData,
      },
      select: INVITATION_SELECT,
    })

    return {
      ...invitation,
      inviteLink: `/invitations/${invitation.token}`,
    }
  }

  async findByToken(token) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      select: INVITATION_SELECT,
    })

    if (!invitation) {
      const error = new Error('Invitation not found')
      error.statusCode = 404
      throw error
    }

    return {
      ...invitation,
      expired: invitation.expiresAt < new Date(),
    }
  }

  async accept(token, userId) {
    const invitation = await this._findPendingByToken(token)

    const existing = await prisma.networkMember.findUnique({
      where: { userId_networkId: { userId, networkId: invitation.networkId } },
    })

    if (existing) {
      const error = new Error('You are already a member of this network')
      error.statusCode = 409
      throw error
    }

    const [member] = await prisma.$transaction([
      prisma.networkMember.create({
        data: {
          userId,
          networkId: invitation.networkId,
          role: invitation.proposedRole,
          medicationAccess: invitation.medicationAccess,
          consultationAccess: invitation.consultationAccess,
          networkAccess: invitation.networkAccess,
          recordsAccess: invitation.recordsAccess,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ])

    return member
  }

  async reject(token) {
    const invitation = await this._findPendingByToken(token)

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'REJECTED' },
    })
  }

  async cancel(invitationId, userId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    })

    if (!invitation) {
      const error = new Error('Invitation not found')
      error.statusCode = 404
      throw error
    }

    if (invitation.inviterId !== userId) {
      const error = new Error('Only the inviter can cancel this invitation')
      error.statusCode = 403
      throw error
    }

    if (invitation.status !== 'PENDING') {
      const error = new Error('Only pending invitations can be canceled')
      error.statusCode = 400
      throw error
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELED' },
    })
  }

  async findAllByUserEmail(email) {
    return prisma.invitation.findMany({
      where: { invitedEmail: email, status: 'PENDING' },
      select: INVITATION_SELECT,
    })
  }

  async _findPendingByToken(token) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      const error = new Error('Invitation not found')
      error.statusCode = 404
      throw error
    }

    if (invitation.status !== 'PENDING') {
      const error = new Error(`Invitation already ${invitation.status.toLowerCase()}`)
      error.statusCode = 400
      throw error
    }

    if (invitation.expiresAt < new Date()) {
      const error = new Error('Invitation has expired')
      error.statusCode = 410
      throw error
    }

    return invitation
  }
}

module.exports = new InvitationService()
