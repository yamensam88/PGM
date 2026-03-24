const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const run = await prisma.dailyRun.findUnique({
    where: { id: "6c587abb-45a5-4f1a-9723-be67bf2e103a" },
    include: {
      rate_card: true,
      driver: true,
      vehicle: true,
    }
  });

  console.log("Run Record Data:", JSON.stringify(run, null, 2));
}

main().finally(() => window ? null : prisma.$disconnect());
