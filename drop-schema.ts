import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Tearing down public schema...');
  // Execute raw query to cascade drop the full schema
  await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE;`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
  
  console.log('Schema wiped successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
