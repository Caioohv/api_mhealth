const prisma = require('../config/prisma');

class TimelineService {
  async getUnifiedTimeline(networkId, limit = 50, offset = 0) {
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);

    const [intakes, occurrences, habitRecords, alerts] = await Promise.all([
      prisma.medicationIntake.findMany({
        where: { medication: { networkId } },
        include: { 
          medication: { select: { name: true } },
          registrar: { select: { name: true } }
        },
        orderBy: { takenAt: 'desc' },
        take: limitInt + offsetInt
      }),
      prisma.occurrence.findMany({
        where: { networkId },
        include: { registrar: { select: { name: true } } },
        orderBy: { occurredAt: 'desc' },
        take: limitInt + offsetInt
      }),
      prisma.habitRecord.findMany({
        where: { habit: { networkId } },
        include: { 
          habit: { select: { name: true } },
          registrar: { select: { name: true } }
        },
        orderBy: { completedAt: 'desc' },
        take: limitInt + offsetInt
      }),
      prisma.emergencyAlert.findMany({
        where: { networkId },
        include: { triggeredByUser: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limitInt + offsetInt
      })
    ]);

    const items = [
      ...intakes.map(i => ({
        id: i.id,
        type: 'MEDICATION',
        title: i.medication.name,
        description: i.status === 'TAKEN' ? 'Tomou o medicamento' : 'Não tomou',
        timestamp: i.takenAt,
        user: i.registrar,
        metadata: { medicationId: i.medicationId, status: i.status, notes: i.notes }
      })),
      ...occurrences.map(o => ({
        id: o.id,
        type: 'OCCURRENCE',
        title: o.title,
        description: o.description,
        timestamp: o.occurredAt,
        user: o.registrar,
        metadata: { occurrenceId: o.id, occurrenceType: o.type }
      })),
      ...habitRecords.map(h => ({
        id: h.id,
        type: 'HABIT',
        title: h.habit.name,
        description: h.notes || 'Hábito concluído',
        timestamp: h.completedAt,
        user: h.registrar,
        metadata: { habitId: h.habitId, value: h.value }
      })),
      ...alerts.map(a => ({
        id: a.id,
        type: 'EMERGENCY',
        title: 'Alerta de Emergência',
        description: a.message || 'SOS acionado',
        timestamp: a.createdAt,
        user: a.triggeredByUser,
        metadata: { alertId: a.id, status: a.status }
      }))
    ];

    return items
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offsetInt, offsetInt + limitInt);
  }
}

module.exports = new TimelineService();
