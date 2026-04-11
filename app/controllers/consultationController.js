const consultationService = require('../services/consultationService');

class ConsultationController {
  async create(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const consultation = await consultationService.create(networkId, req.body);
      res.status(201).json(consultation);
    } catch (error) {
      next(error);
    }
  }

  async listByNetwork(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { type } = req.query;
      const consultations = await consultationService.findAllByNetwork(networkId, type);
      res.json(consultations);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const consultation = await consultationService.findById(id);
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const consultation = await consultationService.update(id, req.body);
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await consultationService.remove(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async getReminders(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { days } = req.query;
      const reminders = await consultationService.getUpcomingReminders(networkId, days ? parseInt(days) : 2);
      res.json(reminders);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConsultationController();
