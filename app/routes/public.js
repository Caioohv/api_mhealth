module.exports = (app) => {
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  })

  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'API mHealth - Bem-vindo!',
      version: '1.0.0'
    })
  })
}
