const { 
  addHours, 
  addDays, 
  isAfter, 
  isBefore, 
  startOfDay, 
  setHours, 
  setMinutes,
  isWithinInterval,
  parseISO
} = require('date-fns');

/**
 * Expands a medication schedule into specific time instances within a given date range.
 * 
 * @param {Object} schedule - The MedicationSchedule object from Prisma
 * @param {Date} rangeStart - The start of the window to expand
 * @param {Date} rangeEnd - The end of the window to expand
 * @returns {Array} List of occurrences with { time, medicationId }
 */
function expandSchedule(schedule, rangeStart, rangeEnd) {
  const occurrences = [];
  const medId = schedule.medicationId;
  
  // Real boundaries: max(schedule.startDate, rangeStart) to min(schedule.endDate, rangeEnd)
  const schedStart = new Date(schedule.startDate);
  const schedEnd = schedule.endDate ? new Date(schedule.endDate) : new Date(8640000000000000); // Far future
  
  const effectiveStart = isAfter(schedStart, rangeStart) ? schedStart : rangeStart;
  const effectiveEnd = isBefore(schedEnd, rangeEnd) ? schedEnd : rangeEnd;

  if (isAfter(effectiveStart, effectiveEnd)) return [];

  // Implementation for specificTimes
  if (schedule.specificTimes && Array.isArray(schedule.specificTimes)) {
    let currentDay = startOfDay(effectiveStart);
    const lastDay = startOfDay(effectiveEnd);

    while (!isAfter(currentDay, lastDay)) {
      schedule.specificTimes.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        let occurrenceTime = setHours(setMinutes(new Date(currentDay), minutes), hours);
        occurrenceTime.setSeconds(0, 0);

        if (isWithinInterval(occurrenceTime, { start: effectiveStart, end: effectiveEnd })) {
          occurrences.push({
            time: occurrenceTime,
            medicationId: medId
          });
        }
      });
      currentDay = addDays(currentDay, 1);
    }
  }

  // Implementation for intervalHours (if no specificTimes)
  else if (schedule.intervalHours) {
    let currentTime = new Date(schedStart);
    while (isBefore(currentTime, effectiveEnd)) {
      if (!isBefore(currentTime, effectiveStart)) {
        occurrences.push({
          time: new Date(currentTime),
          medicationId: medId
        });
      }
      currentTime = addHours(currentTime, schedule.intervalHours);
    }
  }

  return occurrences.sort((a, b) => a.time - b.time);
}

module.exports = {
  expandSchedule
};
