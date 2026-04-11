const occurrenceService = require('../services/occurrenceService');

class OccurrenceController {
  async create(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const userId = req.user.id;
      const occurrence = await occurrenceService.create(networkId, userId, req.body);
      res.status(201).json(occurrence);
    } catch (error) {
      next(error);
    }
  }

  async listByNetwork(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { type, startDate, endDate } = req.query;
      const occurrences = await occurrenceService.findAllByNetwork(networkId, type, startDate, endDate);
      res.json(occurrences);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const occurrence = await occurrenceService.findById(id);
      res.json(occurrence);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const occurrence = await occurrenceService.update(id, req.body);
      res.json(occurrence);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await occurrenceService.remove(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OccurrenceController();
