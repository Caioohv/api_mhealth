const { z } = require('zod');

const medicationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  dosage: z.string().min(1, 'Dosagem é obrigatória'),
  instructions: z.string().optional(),
  needsBuy: z.boolean().optional(),
});

const scheduleSchema = z.object({
  intervalHours: z.number().int().positive().nullable().optional(),
  intervalDays: z.number().int().positive().nullable().optional(),
  specificTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).nullable().optional(),
});

const intakeSchema = z.object({
  status: z.enum(['TAKEN', 'MISSED', 'LATE']),
  notes: z.string().optional(),
  takenAt: z.string().datetime().optional(),
});

const toggleBuySchema = z.object({
  needsBuy: z.boolean()
});

module.exports = {
  medicationSchema,
  scheduleSchema,
  intakeSchema,
  toggleBuySchema
};
