import prisma from "@/lib/prisma";

async function main() {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  console.log("Dashboard fetch parameters:");
  console.log("todayUtc:", todayUtc);

  const rawRuns = await prisma.dailyRun.findMany({
    where: {
      date: todayUtc,
    },
    select: {
      id: true,
      status: true,
      date: true,
    }
  });

  console.log("Runs matching criteria:", rawRuns);
}

main().finally(() => window ? null : null);
