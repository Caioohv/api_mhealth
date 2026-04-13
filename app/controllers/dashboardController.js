const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getPatientDashboard(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const data = await dashboardService.getPatientDashboard(networkId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getCaregiverDashboard(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const data = await dashboardService.getCaregiverDashboard(networkId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getAgenda(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { days, startDate } = req.query;
      const data = await dashboardService.getAgenda(networkId, { 
        days: parseInt(days) || 7, 
        startDate: startDate ? new Date(startDate) : new Date() 
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
