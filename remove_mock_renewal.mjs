import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
   const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' } });
   if (!masterOrg) {
       console.log("No master org found.");
       return;
   }

   let existingSettings = {};
   if (masterOrg.settings_json) {
       existingSettings = typeof masterOrg.settings_json === 'string' 
           ? JSON.parse(masterOrg.settings_json) 
           : masterOrg.settings_json;
   }

   delete existingSettings.current_period_end;

   await prisma.organization.update({
      where: { id: masterOrg.id },
      data: { settings_json: existingSettings }
   });
   
   console.log(`Mock renewal removed for Master Org (ID: ${masterOrg.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
