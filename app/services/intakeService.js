const prisma = require('../config/prisma');

class IntakeService {
  async create(medicationId, userId, data) {
    return await prisma.medicationIntake.create({
      data: {
        ...data,
        medicationId,
        registeredBy: userId,
        takenAt: data.takenAt ? new Date(data.takenAt) : new Date()
      }
    });
  }

  async history(medicationId) {
    return await prisma.medicationIntake.findMany({
      where: { medicationId },
      include: {
        registrar: {
          select: { name: true }
        }
      },
      orderBy: { takenAt: 'desc' }
    });
  }

  async findPending(medicationId) {
    // This logic can be complex (comparing schedules with intake history)
    // For now, let's return a simple structure or implement basic late detection
    // Will be fully implemented in Task 5 (Alerts Logic)
    return [];
  }
}

module.exports = new IntakeService();
