import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'sami88' },
    data: { role: 'owner' }
  });
  console.log("SUCCESS: sami88 role updated to owner");
}

main().finally(() => prisma.$disconnect());
