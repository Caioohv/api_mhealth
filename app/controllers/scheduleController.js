const scheduleService = require('../services/scheduleService');

class ScheduleController {
  async create(req, res, next) {
    try {
      const { id: medicationId } = req.params;
      const schedule = await scheduleService.create(medicationId, req.body);
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const schedule = await scheduleService.update(id, req.body);
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await scheduleService.remove(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScheduleController();
