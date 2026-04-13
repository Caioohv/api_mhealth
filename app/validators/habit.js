const { z } = require('zod');

const habitSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']),
  goal: z.number().int().positive().optional(),
  unit: z.string().optional(),
});

const habitRecordSchema = z.object({
  value: z.number().int().optional(),
  notes: z.string().optional(),
});

module.exports = {
  habitSchema,
  habitRecordSchema,
};
