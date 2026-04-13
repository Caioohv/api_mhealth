const { z } = require('zod');

const emergencySchema = z.object({
  message: z.string().optional(),
});

module.exports = {
  emergencySchema,
};
