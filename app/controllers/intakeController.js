const intakeService = require('../services/intakeService');

class IntakeController {
  async create(req, res, next) {
    try {
      const { id: medicationId } = req.params;
      const userId = req.user.id;
      const intake = await intakeService.create(medicationId, userId, req.body);
      res.status(201).json(intake);
    } catch (error) {
      next(error);
    }
  }

  async history(req, res, next) {
    try {
      const { id: medicationId } = req.params;
      const history = await intakeService.history(medicationId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntakeController();
