const { ZodError } = require('zod');

/**
 * Middleware genérico para validação de esquemas usando Zod.
 * @param {import('zod').ZodSchema} schema O esquema de validação.
 * @param {'body' | 'query' | 'params'} property A propriedade do request a ser validada (default: 'body').
 */
const validate = (schema, property = 'body') => {
  return async (req, res, next) => {
    try {
      // Valida o dado e substitui o original pelo dado transformado/limpo pelo Zod
      req[property] = await schema.parseAsync(req[property]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new Error('Erro de validação');
        validationError.statusCode = 400;
        
        // Formata os erros do Zod para uma estrutura mais amigável
        validationError.details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        // Adiciona a mensagem formatada para que o middleware de erro possa exibir
        validationError.message = `Erro de validação: ${validationError.details.map(d => `${d.path}: ${d.message}`).join(', ')}`;
        
        return next(validationError);
      }
      next(error);
    }
  };
};

module.exports = validate;
