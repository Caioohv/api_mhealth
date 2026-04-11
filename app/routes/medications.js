const medicationController = require('../controllers/medicationController');
const scheduleController = require('../controllers/scheduleController');
const intakeController = require('../controllers/intakeController'); // Will create this next
const checkPermission = require('../middlewares/checkPermission');
const validate = require('../middlewares/validate');
const canRecordIntake = require('../middlewares/canRecordIntake');
const { 
  medicationSchema, 
  toggleBuySchema, 
  scheduleSchema, 
  intakeSchema 
} = require('../validators/medication');

module.exports = (app) => {
  // Medications Core CRUD
  app.post(
    '/api/networks/:id/medications', 
    checkPermission('medicationAccess', 'EDIT'), 
    validate(medicationSchema), 
    medicationController.create
  );

  app.get(
    '/api/networks/:id/medications', 
    checkPermission('medicationAccess', 'VIEW'), 
    medicationController.listByNetwork
  );

  app.get(
    '/api/networks/:id/medications/to-buy', 
    checkPermission('medicationAccess', 'VIEW'), 
    medicationController.listToBuy
  );

  app.get('/api/medications/:id', medicationController.getDetails);
  app.patch('/api/medications/:id', validate(medicationSchema), medicationController.update);
  app.patch('/api/medications/:id/toggle-buy', validate(toggleBuySchema), medicationController.toggleBuy);
  app.delete('/api/medications/:id', medicationController.remove);

  // Schedules
  app.post('/api/medications/:id/schedules', validate(scheduleSchema), scheduleController.create);
  app.patch('/api/schedules/:id', validate(scheduleSchema), scheduleController.update);
  app.delete('/api/schedules/:id', scheduleController.remove);

  // Intakes
  app.post('/api/medications/:id/intakes', canRecordIntake, validate(intakeSchema), intakeController.create);
  app.get('/api/medications/:id/intakes', intakeController.history);

  // Alertas e Monitoramento
  app.get(
    '/api/networks/:id/medications/alerts', 
    checkPermission('medicationAccess', 'VIEW'), 
    medicationController.getAlerts
  );
};
