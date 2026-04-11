const { z } = require('zod');

const occurrenceSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  type: z.enum(['QUEDA', 'MAL_ESTAR', 'OBSERVACAO']),
  occurredAt: z.string().datetime({ message: 'Data e hora inválidas' }).or(z.date()),
});

module.exports = {
  occurrenceSchema,
};
