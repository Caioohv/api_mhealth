const prisma = require('../config/prisma');
const { startOfDay, startOfWeek, endOfDay, endOfWeek } = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

// The app currently serves Brazil users exclusively; anchor "today"/"this week"
// boundaries to this timezone regardless of the server process's own TZ.
const APP_TIMEZONE = 'America/Sao_Paulo';

class HabitService {
  // ─── Window helpers ────────────────────────────────────────────────────────

  /** Returns the start/end of today in the server's local timezone (Brazil UTC-3). */
  getTodayWindow() {
    const now = new Date();
    const zonedNow = toZonedTime(now, APP_TIMEZONE);
    return {
      startDate: fromZonedTime(startOfDay(zonedNow), APP_TIMEZONE),
      endDate: fromZonedTime(endOfDay(zonedNow), APP_TIMEZONE),
    };
  }

  /**
   * Returns the start/end of the current week.
   * weekStartsOn: 1 = Monday (pt-BR convention).
   */
  getWeekWindow() {
    const now = new Date();
    const zonedNow = toZonedTime(now, APP_TIMEZONE);
    return {
      startDate: fromZonedTime(startOfWeek(zonedNow, { weekStartsOn: 1 }), APP_TIMEZONE),
      endDate: fromZonedTime(endOfWeek(zonedNow, { weekStartsOn: 1 }), APP_TIMEZONE),
    };
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(networkId, data) {
    return await prisma.habit.create({
      data: {
        ...data,
        networkId
      }
    });
  }

  async findAllByNetwork(networkId) {
    const habits = await prisma.habit.findMany({
      where: { networkId },
      orderBy: { createdAt: 'desc' }
    });

    if (habits.length === 0) return [];

    const habitIds = habits.map(h => h.id);
    const { startDate: todayStart, endDate: todayEnd } = this.getTodayWindow();

    // Single batch query covers both completedToday and DAILY progress calculation.
    const todayRecords = await prisma.habitRecord.findMany({
      where: {
        habitId: { in: habitIds },
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // Group today's records by habitId for O(1) lookup.
    const todayByHabit = new Map();
    for (const record of todayRecords) {
      if (!todayByHabit.has(record.habitId)) todayByHabit.set(record.habitId, []);
      todayByHabit.get(record.habitId).push(record);
    }

    // Fetch weekly records only for habits that need them (WEEKLY frequency).
    const weeklyHabits = habits.filter(h => h.frequency === 'WEEKLY');
    const weeklyByHabit = new Map();
    if (weeklyHabits.length > 0) {
      const { startDate: weekStart, endDate: weekEnd } = this.getWeekWindow();
      const weekRecords = await prisma.habitRecord.findMany({
        where: {
          habitId: { in: weeklyHabits.map(h => h.id) },
          completedAt: { gte: weekStart, lte: weekEnd },
        },
      });
      for (const record of weekRecords) {
        if (!weeklyByHabit.has(record.habitId)) weeklyByHabit.set(record.habitId, []);
        weeklyByHabit.get(record.habitId).push(record);
      }
    }

    return habits.map(habit => {
      const todaysRecs = todayByHabit.get(habit.id) ?? [];
      // completedToday: at least one HabitRecord exists within today's window.
      const completedToday = todaysRecs.length > 0;

      let records, period;
      if (habit.frequency === 'DAILY') {
        records = todaysRecs;
        period = 'DAILY';
      } else if (habit.frequency === 'WEEKLY') {
        records = weeklyByHabit.get(habit.id) ?? [];
        period = 'WEEKLY';
      } else {
        return { ...habit, completedToday, progress: null };
      }

      const current = records.reduce((sum, r) => sum + (r.value || 1), 0);
      const percentage = habit.goal
        ? Math.min(Math.round((current / habit.goal) * 100), 100)
        : null;
      return {
        ...habit,
        completedToday,
        progress: {
          current,
          goal: habit.goal ?? null,
          percentage,
          period,
        },
      };
    });
  }

  async findById(id) {
    const habit = await prisma.habit.findUnique({
      where: { id },
      include: {
        records: {
          take: 20,
          orderBy: { completedAt: 'desc' },
          include: {
            registrar: { select: { name: true } }
          }
        }
      }
    });

    if (!habit) {
      const error = new Error('Hábito não encontrado');
      error.statusCode = 404;
      throw error;
    }

    const { startDate: todayStart, endDate: todayEnd } = this.getTodayWindow();
    const todayCount = await prisma.habitRecord.count({
      where: {
        habitId: id,
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    });
    const completedToday = todayCount > 0;
    const progress = await this.calculateProgress(habit);
    return { ...habit, completedToday, progress };
  }

  async update(id, data) {
    return await prisma.habit.update({
      where: { id },
      data
    });
  }

  async remove(id) {
    return await prisma.habit.delete({
      where: { id }
    });
  }

  async createRecord(habitId, userId, data) {
    return await prisma.habitRecord.create({
      data: {
        ...data,
        habitId,
        registeredBy: userId
      }
    });
  }

  async findRecordsByHabit(habitId) {
    return await prisma.habitRecord.findMany({
      where: { habitId },
      orderBy: { completedAt: 'desc' },
      include: {
        registrar: { select: { name: true } }
      }
    });
  }

  async calculateProgress(habit) {
    let startDate, endDate;
    const now = new Date();
    const zonedNow = toZonedTime(now, APP_TIMEZONE);

    if (habit.frequency === 'DAILY') {
      startDate = fromZonedTime(startOfDay(zonedNow), APP_TIMEZONE);
      endDate = fromZonedTime(endOfDay(zonedNow), APP_TIMEZONE);
    } else if (habit.frequency === 'WEEKLY') {
      startDate = fromZonedTime(startOfWeek(zonedNow, { weekStartsOn: 1 }), APP_TIMEZONE);
      endDate = fromZonedTime(endOfWeek(zonedNow, { weekStartsOn: 1 }), APP_TIMEZONE);
    } else {
      return null;
    }

    const records = await prisma.habitRecord.findMany({
      where: {
        habitId: habit.id,
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const current = records.reduce((sum, record) => sum + (record.value || 1), 0);
    const percentage = habit.goal
      ? Math.min(Math.round((current / habit.goal) * 100), 100)
      : null;

    return {
      current,
      goal: habit.goal ?? null,
      percentage,
      period: habit.frequency
    };
  }
}

module.exports = new HabitService();
