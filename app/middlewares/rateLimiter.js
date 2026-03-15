const rateLimit = require('express-rate-limit');

/**
 * Limitador de taxa global para evitar abusos
 */
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100, // Limita cada IP a 100 requisições por janela
  message: {
    status: 'error',
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
  },
  standardHeaders: true, // Retorna info nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
});

module.exports = globalLimiter;
