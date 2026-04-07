const medicationService = require('../services/medicationService');
const alertService = require('../services/alertService');

class MedicationController {
  // ... existing methods

  async getAlerts(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const alerts = await alertService.findLateMedications(networkId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const medication = await medicationService.create(networkId, req.body);
      res.status(201).json(medication);
    } catch (error) {
      next(error);
    }
  }

  async listByNetwork(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const medications = await medicationService.findAllByNetwork(networkId);
      res.json(medications);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const medication = await medicationService.findById(id);
      res.json(medication);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const medication = await medicationService.update(id, req.body);
      res.json(medication);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await medicationService.remove(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async toggleBuy(req, res, next) {
    try {
      const { id } = req.params;
      const { needsBuy } = req.body;
      const medication = await medicationService.toggleBuyStatus(id, needsBuy);
      res.json(medication);
    } catch (error) {
      next(error);
    }
  }

  async listToBuy(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const medications = await medicationService.findToBuyByNetwork(networkId);
      res.json(medications);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MedicationController();
