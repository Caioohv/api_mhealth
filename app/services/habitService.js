const prisma = require('../config/prisma');
const { startOfDay, startOfWeek, endOfDay, endOfWeek } = require('date-fns');

class HabitService {
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

    // Add progress for each habit
    return await Promise.all(habits.map(async (habit) => {
      const progress = await this.calculateProgress(habit);
      return { ...habit, progress };
    }));
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

    const progress = await this.calculateProgress(habit);
    return { ...habit, progress };
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
    if (!habit.goal) return null;

    let startDate, endDate;
    const now = new Date();

    if (habit.frequency === 'DAILY') {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    } else if (habit.frequency === 'WEEKLY') {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
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
    const percentage = Math.min(Math.round((current / habit.goal) * 100), 100);

    return {
      current,
      goal: habit.goal,
      percentage,
      period: habit.frequency
    };
  }
}

module.exports = new HabitService();
