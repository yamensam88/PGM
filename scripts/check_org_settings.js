const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    console.log(`Org ID: ${org.id}`);
    console.log(`Settings JSON:`, JSON.stringify(org.settings_json, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
