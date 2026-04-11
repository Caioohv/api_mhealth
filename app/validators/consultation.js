const { z } = require('zod');

const consultationSchema = z.object({
  type: z.enum(['CONSULTA', 'PROCEDIMENTO']).default('CONSULTA'),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  date: z.string().datetime({ message: 'Data inválida' }).or(z.date()),
  doctorName: z.string().optional(),
  specialty: z.string().optional(),
  notes: z.string().optional(),
});

module.exports = {
  consultationSchema,
};
