/**
 * Middleware global de tratamento de erros
 */
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  console.error(`[Error] ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor',
    // Em desenvolvimento, enviamos o stack trace para facilitar o debug
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
