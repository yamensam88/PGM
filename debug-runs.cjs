const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.dailyRun.findMany({ select: { id: true, status: true, date: true, created_at: true, km_end: true }});
  console.log(runs);
}

main().finally(() => prisma.$disconnect());
