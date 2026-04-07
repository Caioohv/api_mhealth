const prisma = require('../config/prisma');

class ScheduleService {
  async create(medicationId, data) {
    return await prisma.medicationSchedule.create({
      data: {
        ...data,
        medicationId
      }
    });
  }

  async update(id, data) {
    return await prisma.medicationSchedule.update({
      where: { id },
      data
    });
  }

  async remove(id) {
    return await prisma.medicationSchedule.delete({
      where: { id }
    });
  }

  // Basic logic to fetch schedules for a medication
  async findByMedication(medicationId) {
    return await prisma.medicationSchedule.findMany({
      where: { medicationId }
    });
  }
}

module.exports = new ScheduleService();
