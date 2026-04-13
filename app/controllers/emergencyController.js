const emergencyService = require('../services/emergencyService');

class EmergencyController {
  async trigger(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const userId = req.user.id;
      const result = await emergencyService.trigger(networkId, userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listByNetwork(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const alerts = await emergencyService.findAllByNetwork(networkId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req, res, next) {
    try {
      const { id } = req.params;
      const alert = await emergencyService.resolve(id);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const alert = await emergencyService.cancel(id);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmergencyController();
