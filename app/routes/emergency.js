const emergencyController = require('../controllers/emergencyController');
const validate = require('../middlewares/validate');
const { emergencySchema } = require('../validators/emergency');

module.exports = (app) => {
  // Routes nested under networks (for triggering and status)
  app.post(
    '/api/networks/:id/emergency',
    validate(emergencySchema),
    emergencyController.trigger
  );

  app.get(
    '/api/networks/:id/emergency',
    emergencyController.listByNetwork
  );

  // Individual emergency routes
  app.patch('/api/emergency/:id/resolve', emergencyController.resolve);
  app.patch('/api/emergency/:id/cancel', emergencyController.cancel);
};
