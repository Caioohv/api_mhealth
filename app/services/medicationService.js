const prisma = require('../config/prisma');

class MedicationService {
  async create(networkId, data) {
    return await prisma.medication.create({
      data: {
        ...data,
        networkId
      }
    });
  }

  async findAllByNetwork(networkId) {
    return await prisma.medication.findMany({
      where: { networkId },
      include: {
        schedules: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id) {
    const medication = await prisma.medication.findUnique({
      where: { id },
      include: {
        schedules: true,
        intakes: {
          take: 10,
          orderBy: { takenAt: 'desc' },
          include: {
            registrar: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!medication) {
      const error = new Error('Medicamento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return medication;
  }

  async update(id, data) {
    return await prisma.medication.update({
      where: { id },
      data
    });
  }

  async remove(id) {
    return await prisma.medication.delete({
      where: { id }
    });
  }

  async toggleBuyStatus(id, needsBuy) {
    return await prisma.medication.update({
      where: { id },
      data: { needsBuy }
    });
  }

  async findToBuyByNetwork(networkId) {
    return await prisma.medication.findMany({
      where: { 
        networkId,
        needsBuy: true
      },
      orderBy: { name: 'asc' }
    });
  }
}

module.exports = new MedicationService();
