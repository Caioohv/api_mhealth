const { PrismaClient } = require('@prisma/client')

let prisma

if (process.env.NODE_ENV === 'test') {
  // In test mode, use the dedicated SQLite client generated from schema.sqlite.prisma.
  // Prisma 7 (WASM engine) requires a driver adapter; use @prisma/adapter-libsql for SQLite.
  const path = require('path')
  const { PrismaLibSql } = require('@prisma/adapter-libsql')
  const { PrismaClient: TestPrismaClient } = require('../../node_modules/.prisma/test-client')

  const dbUrl = process.env.DATABASE_URL || 'file:./test.db'
  // libsql requires an absolute file URL; resolve relative paths.
  const resolvedUrl = dbUrl.startsWith('file:') && !dbUrl.startsWith('file:/')
    ? 'file:' + path.resolve(dbUrl.replace(/^file:/, ''))
    : dbUrl
  // PrismaLibSql is a factory that accepts { url } config, not a libsql client instance.
  const adapter = new PrismaLibSql({ url: resolvedUrl })
  prisma = new TestPrismaClient({ adapter })
} else {
  const { PrismaMariaDb } = require('@prisma/adapter-mariadb')

  const adapter = new PrismaMariaDb({
    host:            process.env.DATABASE_HOST || '127.0.0.1',
    port:            Number(process.env.DATABASE_PORT) || 3306,
    user:            process.env.DATABASE_USER,
    password:        process.env.DATABASE_PASSWORD,
    database:        process.env.DATABASE_NAME,
    connectionLimit: 10,
  })

  prisma = new PrismaClient({ adapter })
}

module.exports = prisma
