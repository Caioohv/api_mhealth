const prisma = require('../config/prisma');
const { addDays, startOfDay, endOfDay } = require('date-fns');

class ConsultationService {
  async create(networkId, data) {
    return await prisma.consultation.create({
      data: {
        ...data,
        networkId
      }
    });
  }

  async findAllByNetwork(networkId, { type, startDate, endDate } = {}) {
    const where = { networkId };
    if (type) where.type = type;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return await prisma.consultation.findMany({
      where,
      orderBy: { date: 'asc' }
    });
  }

  async findById(id) {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        network: {
          select: { name: true }
        }
      }
    });

    if (!consultation) {
      const error = new Error('Consulta/Procedimento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return consultation;
  }

  async update(id, data) {
    return await prisma.consultation.update({
      where: { id },
      data
    });
  }

  async remove(id) {
    return await prisma.consultation.delete({
      where: { id }
    });
  }

  async getUpcomingReminders(networkId, daysAhead = 2) {
    const now = new Date();
    const horizon = addDays(now, daysAhead);

    return await prisma.consultation.findMany({
      where: {
        networkId,
        date: {
          gte: now,
          lte: horizon
        }
      },
      orderBy: { date: 'asc' }
    });
  }
}

module.exports = new ConsultationService();
