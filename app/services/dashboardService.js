const prisma = require('../config/prisma');
const { startOfDay, endOfDay, addDays, isAfter, isBefore, format } = require('date-fns');
const agendaUtils = require('../utils/agendaUtils');

class DashboardService {
  async getPatientDashboard(networkId) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowEnd = endOfDay(now);
    const nextWeek = addDays(now, 7);

    // 1. Today's Medications (all doses)
    const medications = await prisma.medication.findMany({
      where: { networkId },
      include: { 
        schedules: true, 
        intakes: { 
          where: { takenAt: { gte: todayStart, lte: tomorrowEnd } } 
        } 
      }
    });

    const medicationsToday = [];
    for (const med of medications) {
      for (const schedule of med.schedules) {
        const instances = agendaUtils.expandSchedule(schedule, todayStart, tomorrowEnd);
        instances.forEach(instance => {
          const taken = med.intakes.some(i => {
            const iTime = new Date(i.takenAt);
            return Math.abs(iTime - instance.time) < 3600000; // 1h margin
          });
          
          medicationsToday.push({
            id: med.id,
            name: med.name,
            time: format(instance.time, 'HH:mm'),
            dosage: med.dosage,
            taken
          });
        });
      }
    }

    // 2. Pending Habits (DAILY)
    const habits = await prisma.habit.findMany({
      where: { networkId, frequency: 'DAILY' },
      include: { 
        records: { 
          where: { completedAt: { gte: todayStart } } 
        } 
      }
    });
    
    const pendingHabits = habits.filter(h => {
      const current = h.records.reduce((sum, r) => sum + (r.value || 1), 0);
      return !h.goal || current < h.goal;
    }).map(h => ({ 
      id: h.id, 
      name: h.name, 
      current: h.records.reduce((sum, r) => sum + (r.value || 1), 0),
      goal: h.goal, 
      unit: h.unit 
    }));

    // 3. Upcoming Consultations (next 7 days)
    const consultations = await prisma.consultation.findMany({
      where: { 
        networkId, 
        date: { gte: now, lte: nextWeek } 
      },
      orderBy: { date: 'asc' }
    });

    return { 
      todayMedications: medicationsToday.sort((a,b) => a.time.localeCompare(b.time)), 
      pendingHabits, 
      upcomingConsultations: consultations 
    };
  }

  async getCaregiverDashboard(networkId) {
    const todayStart = startOfDay(new Date());

    const [activeAlerts, occurrences, intakesCount] = await Promise.all([
      prisma.emergencyAlert.findMany({
        where: { networkId, status: 'ACTIVE' },
        include: { triggeredByUser: { select: { name: true } } }
      }),
      prisma.occurrence.findMany({
        where: { networkId },
        orderBy: { occurredAt: 'desc' },
        take: 5
      }),
      prisma.medicationIntake.count({
        where: { 
          medication: { networkId }, 
          takenAt: { gte: todayStart }, 
          status: 'TAKEN' 
        }
      })
    ]);
    
    return { 
      activeAlerts, 
      recentOccurrences: occurrences, 
      stats: { 
        intakesToday: intakesCount 
      } 
    };
  }

  async getAgenda(networkId, { days = 7, startDate = new Date() } = {}) {
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(addDays(rangeStart, days - 1));

    // 1. Fetch Medications and Consultations
    const [medications, consultations] = await Promise.all([
      prisma.medication.findMany({
        where: { networkId },
        include: { 
          schedules: true, 
          intakes: { 
            where: { takenAt: { gte: rangeStart, lte: rangeEnd } } 
          } 
        }
      }),
      prisma.consultation.findMany({
        where: { 
          networkId, 
          date: { gte: rangeStart, lte: rangeEnd } 
        },
        orderBy: { date: 'asc' }
      })
    ]);

    const allEvents = [];

    // 2. Expand Medications
    medications.forEach(med => {
      med.schedules.forEach(schedule => {
        const instances = agendaUtils.expandSchedule(schedule, rangeStart, rangeEnd);
        instances.forEach(instance => {
          const taken = med.intakes.some(i => {
            const iTime = new Date(i.takenAt);
            return Math.abs(iTime - instance.time) < 3600000; // 1h margin
          });
          
          allEvents.push({
            type: 'MEDICATION',
            id: med.id,
            name: med.name,
            time: instance.time,
            dosage: med.dosage,
            taken
          });
        });
      });
    });

    // 3. Add Consultations
    consultations.forEach(c => {
      allEvents.push({
        type: 'CONSULTATION',
        id: c.id,
        name: c.title,
        time: c.date,
        doctor: c.doctorName,
        specialty: c.specialty
      });
    });

    // 4. Sort and Group by Date
    const agenda = {};
    allEvents
      .sort((a, b) => a.time - b.time)
      .forEach(event => {
        const dateKey = format(event.time, 'yyyy-MM-dd');
        if (!agenda[dateKey]) agenda[dateKey] = [];
        agenda[dateKey].push(event);
      });

    return agenda;
  }
}

module.exports = new DashboardService();
