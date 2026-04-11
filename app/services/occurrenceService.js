const prisma = require('../config/prisma');

class OccurrenceService {
  async create(networkId, userId, data) {
    return await prisma.occurrence.create({
      data: {
        ...data,
        networkId,
        registeredBy: userId
      }
    });
  }

  async findAllByNetwork(networkId, type, startDate, endDate) {
    const where = { networkId };
    if (type) where.type = type;
    
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    return await prisma.occurrence.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      include: {
        registrar: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async findById(id) {
    const occurrence = await prisma.occurrence.findUnique({
      where: { id },
      include: {
        registrar: {
          select: { id: true, name: true }
        },
        network: {
          select: { name: true }
        }
      }
    });

    if (!occurrence) {
      const error = new Error('Ocorrência não encontrada');
      error.statusCode = 404;
      throw error;
    }

    return occurrence;
  }

  async update(id, data) {
    return await prisma.occurrence.update({
      where: { id },
      data
    });
  }

  async remove(id) {
    return await prisma.occurrence.delete({
      where: { id }
    });
  }
}

module.exports = new OccurrenceService();
