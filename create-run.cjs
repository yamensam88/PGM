const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findFirst();
  const vehicle = await prisma.vehicle.findFirst();
  const client = await prisma.client.findFirst();
  const zone = await prisma.zone.findFirst();

  if (!driver || !vehicle || !client || !zone) {
    console.log("Missing base data (driver, vehicle, client, zone).");
    return;
  }

  const run = await prisma.dailyRun.create({
    data: {
      organization_id: driver.organization_id,
      date: new Date(),
      driver_id: driver.id,
      vehicle_id: vehicle.id,
      client_id: client.id,
      zone_id: zone.id,
      status: 'planned'
    }
  });

  console.log("RUN CREATED:", run.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
