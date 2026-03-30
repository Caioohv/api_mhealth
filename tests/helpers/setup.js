const { execSync } = require('child_process');
const prisma = require('../../app/config/prisma');

beforeAll(async () => {
  // Ensure we are using the test database
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV must be set to "test"');
  }

  // Push the schema to the SQLite database
  execSync('npx prisma db push --schema=prisma/schema.sqlite.prisma --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
});

beforeEach(async () => {
  // Clean database between tests to ensure isolation
  const tablenames = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';
  `;

  for (const { name } of tablenames) {
    if (name !== 'sqlite_sequence') {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
      } catch (error) {
        console.log(`Error cleaning table ${name}:`, error.message);
      }
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
