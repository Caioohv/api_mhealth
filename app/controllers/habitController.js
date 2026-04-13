const habitService = require('../services/habitService');

class HabitController {
  async create(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const habit = await habitService.create(networkId, req.body);
      res.status(201).json(habit);
    } catch (error) {
      next(error);
    }
  }

  async listByNetwork(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const habits = await habitService.findAllByNetwork(networkId);
      res.json(habits);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const habit = await habitService.findById(id);
      res.json(habit);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const habit = await habitService.update(id, req.body);
      res.json(habit);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await habitService.remove(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async addRecord(req, res, next) {
    try {
      const { id: habitId } = req.params;
      const userId = req.user.id;
      const record = await habitService.createRecord(habitId, userId, req.body);
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  async listRecords(req, res, next) {
    try {
      const { id: habitId } = req.params;
      const records = await habitService.findRecordsByHabit(habitId);
      res.json(records);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HabitController();
