module.exports = (app) => {
    app.get('/api/users', (req, res) => {
    res.status(200).json({
      message: 'Lista de usuários (rota privada)',
      data: []
    })
  })

  app.get('/api/dashboard', (req, res) => {
    res.status(200).json({
      message: 'Dashboard (rota privada)',
      data: {}
    })
  })

}
