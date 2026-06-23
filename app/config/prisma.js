const { PrismaClient } = require('@prisma/client')

function createTestClient() {
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

  const url = process.env.DATABASE_URL ?? 'file:./test.db'
  const adapter = new PrismaBetterSqlite3({ url })

  return new PrismaClient({ adapter, log: ['error'] })
}

function createProductionClient() {
  const { PrismaMariaDb } = require('@prisma/adapter-mariadb')

  const adapter = new PrismaMariaDb({
    host:            process.env.DATABASE_HOST || '127.0.0.1',
    port:            Number(process.env.DATABASE_PORT) || 3306,
    user:            process.env.DATABASE_USER,
    password:        process.env.DATABASE_PASSWORD,
    database:        process.env.DATABASE_NAME,
    connectionLimit: 10,
  })

  return new PrismaClient({ adapter })
}

const globalForPrisma = global

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma =
    process.env.NODE_ENV === 'test' ? createTestClient() : createProductionClient()
}

module.exports = globalForPrisma.prisma
