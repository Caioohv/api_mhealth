const prisma = require('../config/prisma')

const NETWORK_SELECT = {
  id: true,
  name: true,
  description: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
}

const MEMBER_SELECT = {
  id: true,
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

class NetworkService {
  async create(userId, data) {
    const { name, description } = data

    if (!name) {
      const error = new Error('Name is required')
      error.statusCode = 400
      throw error
    }

    return prisma.supportNetwork.create({
      data: {
        name,
        description,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'RESPONSAVEL',
            medicationAccess: 'EDIT',
            consultationAccess: 'EDIT',
            networkAccess: 'EDIT',
            recordsAccess: 'EDIT',
            alertLevel: 'ALL',
          },
        },
      },
      select: {
        ...NETWORK_SELECT,
        members: { select: MEMBER_SELECT },
      },
    })
  }

  async findAllByUser(userId) {
    const memberships = await prisma.networkMember.findMany({
      where: { userId },
      select: {
        role: true,
        joinedAt: true,
        medicationAccess: true,
        consultationAccess: true,
        networkAccess: true,
        recordsAccess: true,
        network: {
          select: {
            ...NETWORK_SELECT,
            _count: { select: { members: true } },
          },
        },
      },
    })

    return memberships.map(({ role, joinedAt, network, ...permissions }) => ({
      ...network,
      ...permissions,
      memberCount: network._count.members,
      _count: undefined,
      myRole: role,
      joinedAt,
    }))
  }

  async findById(networkId, userId) {
    const network = await prisma.supportNetwork.findUnique({
      where: { id: networkId },
      select: {
        ...NETWORK_SELECT,
        members: { select: MEMBER_SELECT },
      },
    })

    if (!network) {
      const error = new Error('Network not found')
      error.statusCode = 404
      throw error
    }

    const isMember = network.members.some((m) => m.user.id === userId)
    if (!isMember) {
      const error = new Error('Access denied')
      error.statusCode = 403
      throw error
    }

    return network
  }

  async update(networkId, userId, data) {
    await this._ensureCreator(networkId, userId)

    const { name, description } = data
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields to update')
      error.statusCode = 400
      throw error
    }

    return prisma.supportNetwork.update({
      where: { id: networkId },
      data: updateData,
      select: NETWORK_SELECT,
    })
  }

  async remove(networkId, userId) {
    await this._ensureCreator(networkId, userId)
    await prisma.supportNetwork.delete({ where: { id: networkId } })
  }

  async _ensureCreator(networkId, userId) {
    const network = await prisma.supportNetwork.findUnique({
      where: { id: networkId },
      select: { creatorId: true },
    })

    if (!network) {
      const error = new Error('Network not found')
      error.statusCode = 404
      throw error
    }

    if (network.creatorId !== userId) {
      const error = new Error('Only the network creator can perform this action')
      error.statusCode = 403
      throw error
    }
  }
}

module.exports = new NetworkService()
