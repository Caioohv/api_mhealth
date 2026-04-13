const timelineService = require('../services/timelineService');

class TimelineController {
  async getTimeline(req, res, next) {
    try {
      const { id: networkId } = req.params;
      const { limit, offset } = req.query;
      const timeline = await timelineService.getUnifiedTimeline(networkId, limit, offset);
      res.json(timeline);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TimelineController();
