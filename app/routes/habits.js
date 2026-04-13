const habitController = require('../controllers/habitController');
const checkPermission = require('../middlewares/checkPermission');
const validate = require('../middlewares/validate');
const { habitSchema, habitRecordSchema } = require('../validators/habit');

module.exports = (app) => {
  // Routes nested under networks (for creation and listing)
  app.post(
    '/api/networks/:id/habits',
    checkPermission('recordsAccess', 'EDIT'),
    validate(habitSchema),
    habitController.create
  );

  app.get(
    '/api/networks/:id/habits',
    checkPermission('recordsAccess', 'VIEW'),
    habitController.listByNetwork
  );

  // Individual habit routes
  app.get('/api/habits/:id', habitController.getDetails);
  app.patch('/api/habits/:id', validate(habitSchema), habitController.update);
  app.delete('/api/habits/:id', habitController.remove);

  // Records
  app.post(
    '/api/habits/:id/records',
    validate(habitRecordSchema),
    habitController.addRecord
  );

  app.get('/api/habits/:id/records', habitController.listRecords);
};
