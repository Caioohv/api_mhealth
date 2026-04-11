const occurrenceController = require('../controllers/occurrenceController');
const checkPermission = require('../middlewares/checkPermission');
const validate = require('../middlewares/validate');
const { occurrenceSchema } = require('../validators/occurrence');

module.exports = (app) => {
  app.post(
    '/api/networks/:id/occurrences',
    checkPermission('recordsAccess', 'EDIT'),
    validate(occurrenceSchema),
    occurrenceController.create
  );

  app.get(
    '/api/networks/:id/occurrences',
    checkPermission('recordsAccess', 'VIEW'),
    occurrenceController.listByNetwork
  );

  app.get('/api/occurrences/:id', occurrenceController.getDetails);
  app.patch('/api/occurrences/:id', validate(occurrenceSchema), occurrenceController.update);
  app.delete('/api/occurrences/:id', occurrenceController.remove);
};
