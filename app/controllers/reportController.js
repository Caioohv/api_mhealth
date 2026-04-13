const reportService = require('../services/reportService');

class ReportController {
  async getAdherenceReport(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { days } = req.query;
      const report = await reportService.getMedicationAdherence(networkId, days);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async getHabitsReport(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { days } = req.query;
      const report = await reportService.getHabitPerformance(networkId, days);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
