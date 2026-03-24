const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const d = new Date(); // local time (e.g. 2026-03-16 10AM)
  const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); 
  
  console.log("Searching for exact date:", utcDate);
  const runs = await prisma.dailyRun.findMany({
    where: {
      date: utcDate
    }
  });

  console.log("Found:", runs.length);
}

main().finally(() => prisma.$disconnect());
