const consultationController = require('../controllers/consultationController');
const checkPermission = require('../middlewares/checkPermission');
const validate = require('../middlewares/validate');
const { consultationSchema } = require('../validators/consultation');

module.exports = (app) => {
  app.post(
    '/api/networks/:id/consultations',
    checkPermission('consultationAccess', 'EDIT'),
    validate(consultationSchema),
    consultationController.create
  );

  app.get(
    '/api/networks/:id/consultations',
    checkPermission('consultationAccess', 'VIEW'),
    consultationController.listByNetwork
  );

  app.get(
    '/api/networks/:id/consultations/reminders',
    checkPermission('consultationAccess', 'VIEW'),
    consultationController.getReminders
  );

  app.get('/api/consultations/:id', consultationController.getDetails);
  app.patch('/api/consultations/:id', validate(consultationSchema), consultationController.update);
  app.delete('/api/consultations/:id', consultationController.remove);
};
