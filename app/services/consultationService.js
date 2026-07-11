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
    const existing = await prisma.consultation.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Consulta/Procedimento não encontrado');
      error.statusCode = 404;
      throw error;
    }
    return await prisma.consultation.update({
      where: { id },
      data
    });
  }

  async remove(id) {
    const existing = await prisma.consultation.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Consulta/Procedimento não encontrado');
      error.statusCode = 404;
      throw error;
    }
    return await prisma.consultation.delete({
      where: { id }
    });
  }

  async updateAttendance(id, attendanceStatus, userId) {
    const consultation = await this.findById(id);

    const levels = { NONE: 0, VIEW: 1, EDIT: 2 };
    const member = await prisma.networkMember.findUnique({
      where: { userId_networkId: { userId, networkId: consultation.networkId } },
    });

    if (!member) {
      const error = new Error('Você não é membro desta rede');
      error.statusCode = 403;
      throw error;
    }

    if (levels[member.consultationAccess] < levels['EDIT']) {
      const error = new Error('Permissão insuficiente para registrar comparecimento');
      error.statusCode = 403;
      throw error;
    }

    return await prisma.consultation.update({
      where: { id },
      data: { attendanceStatus },
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
