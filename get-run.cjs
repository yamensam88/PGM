const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const run = await prisma.dailyRun.findFirst({
    where: { status: { not: 'completed' } },
    select: { id: true, driver: { select: { first_name: true, last_name: true } } }
  });
  console.log("RUN_ID:", run ? run.id : "Aucune tournée trouvée");
  if (run) {
     console.log("Chauffeur:", run.driver.first_name, run.driver.last_name);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
