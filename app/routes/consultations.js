const consultationController = require('../controllers/consultationController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkPermission = require('../middlewares/checkPermission');
const validate = require('../middlewares/validate');
const { consultationSchema, attendanceSchema } = require('../validators/consultation');

module.exports = (app) => {
  app.post(
    '/api/networks/:id/consultations',
    checkPermission('consultationAccess', 'EDIT'),
    validate(consultationSchema),
    consultationController.create
  );

  app.get(
    '/api/networks/:id/consultations',
    checkPermission('consultationAccess', 'VIEW', { allowRoles: ['ASSISTIDO'] }),
    consultationController.listByNetwork
  );

  app.get(
    '/api/networks/:id/consultations/reminders',
    checkPermission('consultationAccess', 'VIEW', { allowRoles: ['ASSISTIDO'] }),
    consultationController.getReminders
  );

  app.get('/api/consultations/:id', authMiddleware, consultationController.getDetails);
  app.patch('/api/consultations/:id', authMiddleware, validate(consultationSchema), consultationController.update);
  app.patch('/api/consultations/:id/attendance', authMiddleware, validate(attendanceSchema), consultationController.updateAttendance);
  app.delete('/api/consultations/:id', authMiddleware, consultationController.remove);
};
