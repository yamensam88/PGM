import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
   const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' } });
   if (!masterOrg) {
       console.log("No master org found.");
       return;
   }

   const in5Days = new Date();
   in5Days.setDate(in5Days.getDate() + 5);

   let existingSettings = {};
   if (masterOrg.settings_json) {
       existingSettings = typeof masterOrg.settings_json === 'string' 
           ? JSON.parse(masterOrg.settings_json) 
           : masterOrg.settings_json;
   }

   existingSettings.current_period_end = in5Days.toISOString();

   await prisma.organization.update({
      where: { id: masterOrg.id },
      data: { settings_json: existingSettings }
   });
   
   console.log(`Mock renewal set to ${in5Days.toISOString()} for Master Org (ID: ${masterOrg.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
