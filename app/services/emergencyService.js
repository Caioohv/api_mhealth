const prisma = require('../config/prisma');

class EmergencyService {
  async trigger(networkId, userId, data) {
    const alert = await prisma.emergencyAlert.create({
      data: {
        ...data,
        networkId,
        triggeredBy: userId,
        status: 'ACTIVE'
      },
      include: {
        triggeredByUser: {
          select: { name: true, phone: true }
        }
      }
    });

    // Determine who should be notified
    const membersToNotify = await prisma.networkMember.findMany({
      where: {
        networkId,
        alertLevel: {
          in: ['ALL', 'EMERGENCY_ONLY']
        },
        userId: {
          not: userId // Don't notify the person who triggered it
        }
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    return {
      alert,
      notifiedMembers: membersToNotify.map(m => ({
        id: m.user.id,
        name: m.user.name,
        phone: m.user.phone
      }))
    };
  }

  async findAllByNetwork(networkId) {
    return await prisma.emergencyAlert.findMany({
      where: { networkId },
      orderBy: { createdAt: 'desc' },
      include: {
        triggeredByUser: {
          select: { name: true }
        }
      }
    });
  }

  async resolve(id) {
    return await prisma.emergencyAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });
  }

  async cancel(id) {
    return await prisma.emergencyAlert.update({
      where: { id },
      data: {
        status: 'CANCELED'
      }
    });
  }
}

module.exports = new EmergencyService();
