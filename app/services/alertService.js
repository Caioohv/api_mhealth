const prisma = require('../config/prisma');
const { format, isAfter, parseISO, startOfDay, addHours } = require('date-fns');

class AlertService {
  /**
   * Scans a network for medications that are late
   * @param {string} networkId 
   */
  async findLateMedications(networkId) {
    const now = new Date();
    const today = startOfDay(now);

    const medications = await prisma.medication.findMany({
      where: { networkId },
      include: {
        schedules: true,
        intakes: {
          where: {
            takenAt: { gte: today }
          },
          orderBy: { takenAt: 'desc' }
        }
      }
    });

    const lateMedications = [];

    for (const med of medications) {
      if (med.needsBuy) {
        // This is a simple flag-based alert
        med.alertType = 'NEEDS_BUY';
        lateMedications.push(med);
        continue;
      }

      for (const schedule of med.schedules) {
        // Logic for specificTimes
        if (schedule.specificTimes && Array.isArray(schedule.specificTimes)) {
          for (const timeStr of schedule.specificTimes) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const scheduledTime = new Date(today);
            scheduledTime.setHours(hours, minutes, 0, 0);

            // If scheduled time has passed and no intake exists near that time
            if (isAfter(now, scheduledTime)) {
              const hasIntake = med.intakes.some(intake => {
                const intakeTime = new Date(intake.takenAt);
                // Simple check: if intake is within 2 hours of scheduled time
                const diff = Math.abs(intakeTime - scheduledTime) / 36e5;
                return diff < 2; 
              });

              if (!hasIntake) {
                med.alertType = 'LATE_DOSE';
                med.lateTime = timeStr;
                lateMedications.push(med);
                break;
              }
            }
          }
        }

        // Logic for intervalHours
        if (schedule.intervalHours) {
          const lastIntake = await prisma.medicationIntake.findFirst({
            where: { medicationId: med.id },
            orderBy: { takenAt: 'desc' }
          });

          if (lastIntake) {
            const nextDose = addHours(new Date(lastIntake.takenAt), schedule.intervalHours);
            if (isAfter(now, nextDose)) {
              med.alertType = 'LATE_DOSE';
              med.nextDoseExpected = nextDose;
              lateMedications.push(med);
              break;
            }
          }
        }
      }
    }

    return lateMedications;
  }
}

module.exports = new AlertService();
