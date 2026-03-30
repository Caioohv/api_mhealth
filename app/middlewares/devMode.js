const devMode = (req, res, next) => {
  if (process.env.DEVMODE === 'true') {
    next()
  } else {
    res.status(403).json({ message: 'Forbidden' })
  }
}