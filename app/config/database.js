const { PrismaClient } = require('@prisma/client');

/**
 * Instância singleton do Prisma Client
 * 
 * Em desenvolvimento, o Node.js limpa o cache de módulos no hot-reload,
 * o que pode criar múltiplas instâncias do Prisma Client e esgotar as conexões.
 * Para evitar isso, usamos uma variável global que persiste entre reloads.
 */

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
