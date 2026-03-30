const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const adapter = new PrismaMariaDb({
  host:            process.env.DATABASE_HOST,
  port:            Number(process.env.DATABASE_PORT) || 3306,
  user:            process.env.DATABASE_USER,
  password:        process.env.DATABASE_PASSWORD,
  database:        process.env.DATABASE_NAME,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: { email: true, name: true }
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
