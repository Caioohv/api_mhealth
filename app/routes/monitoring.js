const timelineController = require('../controllers/timelineController');
const dashboardController = require('../controllers/dashboardController');
const reportController = require('../controllers/reportController');
const checkPermission = require('../middlewares/checkPermission');

module.exports = (app) => {
  // Timeline
  app.get(
    '/api/networks/:id/timeline', 
    checkPermission('recordsAccess', 'VIEW'), 
    timelineController.getTimeline
  );

  // Dashboards
  app.get(
    '/api/networks/:id/dashboard/patient', 
    checkPermission('recordsAccess', 'VIEW'), 
    dashboardController.getPatientDashboard
  );
  
  app.get(
    '/api/networks/:id/dashboard/caregiver', 
    checkPermission('recordsAccess', 'VIEW'), 
    dashboardController.getCaregiverDashboard
  );

  app.get(
    '/api/networks/:id/agenda', 
    checkPermission('recordsAccess', 'VIEW'), 
    dashboardController.getAgenda
  );

  // Reports
  app.get(
    '/api/networks/:id/reports/adherence', 
    checkPermission('recordsAccess', 'VIEW'), 
    reportController.getAdherenceReport
  );
  
  app.get(
    '/api/networks/:id/reports/habits', 
    checkPermission('recordsAccess', 'VIEW'), 
    reportController.getHabitsReport
  );
};
