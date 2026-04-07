require('./app/utils/polyfill')
require('dotenv').config()
const express = require('express')
const app = express()

const configure = require('./app/config/express')

const PORT = process.env.PORT || 3000

configure(app)

app.listen(PORT, () => {
  console.log(`\x1b[32mServer running on port ${PORT}\x1b[0m`)
})
