const { z } = require('zod');

const networkSchema = z.object({
  name: z.string().min(3, 'O nome da rede deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
});

module.exports = {
  networkSchema,
};
