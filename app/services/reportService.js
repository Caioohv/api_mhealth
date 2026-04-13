const prisma = require('../config/prisma');
const { startOfDay, subDays, format, eachDayOfInterval } = require('date-fns');

class ReportService {
  async getMedicationAdherence(networkId, days = 30) {
    const daysInt = parseInt(days);
    const startDate = startOfDay(subDays(new Date(), daysInt));

    const medications = await prisma.medication.findMany({
      where: { networkId },
      include: {
        intakes: {
          where: { takenAt: { gte: startDate } }
        }
      }
    });

    const report = medications.map(med => {
      const total = med.intakes.length;
      const taken = med.intakes.filter(i => i.status === 'TAKEN').length;
      const late = med.intakes.filter(i => i.status === 'LATE').length;
      const missed = med.intakes.filter(i => i.status === 'MISSED').length;

      const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

      return {
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        stats: { 
          total, 
          taken, 
          late, 
          missed, 
          adherenceRate 
        }
      };
    });

    // Sort by lower adherence first to highlight problems
    return {
      periodDays: daysInt,
      medications: report.sort((a,b) => a.stats.adherenceRate - b.stats.adherenceRate)
    };
  }

  async getHabitPerformance(networkId, days = 30) {
    const daysInt = parseInt(days);
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, daysInt));

    const habits = await prisma.habit.findMany({
      where: { networkId },
      include: {
        records: {
          where: { completedAt: { gte: startDate } }
        }
      }
    });

    const report = habits.map(habit => {
      const interval = eachDayOfInterval({ start: startDate, end: endDate });
      
      const dailyProgress = interval.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTotal = habit.records
          .filter(r => format(new Date(r.completedAt), 'yyyy-MM-dd') === dateStr)
          .reduce((sum, r) => sum + (r.value || 1), 0);
        
        return { 
          date: dateStr, 
          value: dayTotal, 
          goal: habit.goal,
          goalMet: habit.goal ? dayTotal >= habit.goal : dayTotal > 0 
        };
      });

      const daysGoalMet = dailyProgress.filter(d => d.goalMet).length;
      const consistencyRate = Math.round((daysGoalMet / interval.length) * 100);

      return {
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        consistencyRate,
        dailyProgress
      };
    });

    return { 
      periodDays: daysInt, 
      habits 
    };
  }
}

module.exports = new ReportService();
