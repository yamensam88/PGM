import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  if (orgs.length === 0) {
    console.log("No organizations found.");
    return;
  }
  const orgId = orgs[0].id;
  console.log("Using org:", orgId);

  // vehicle fixed cost
  const activeVehicles = await prisma.vehicle.findMany({ where: { organization_id: orgId, status: 'active' } });
  const globalVehicleFixedParams = activeVehicles.reduce((sum, v) => sum + ((Number(v.fixed_monthly_cost||0) + Number(v.rental_monthly_cost||0) + Number(v.insurance_monthly_cost||0))/25.33), 0);
  
  // employee fixed cost
  const allActiveEmployees = await prisma.driver.findMany({ where: { organization_id: orgId, status: 'active' } });
  const globalDriverFixedParams = allActiveEmployees.reduce((sum, d) => {
     const explicitMonthly = d.hourly_cost ? Number(d.hourly_cost) : (Number(d.daily_base_cost||0) * 25.33);
     return sum + (explicitMonthly / 25.33);
  }, 0);

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const orgSettings = org?.settings_json;
  const monthlyFixedCostAdmin = orgSettings?.monthly_total_fixed_costs ? Number(orgSettings.monthly_total_fixed_costs) : 0;
  const periodAdminFixedCosts = (monthlyFixedCostAdmin / 25.33);

  console.log("activeVehicles count:", activeVehicles.length);
  console.log("allActiveEmployees count:", allActiveEmployees.length);
  console.log("DAILY Vehicle Fixed Params:", globalVehicleFixedParams);
  console.log("DAILY Driver Fixed Params:", globalDriverFixedParams);
  console.log("DAILY Admin Fixed Params:", periodAdminFixedCosts);
  
  console.log("TOTAL DAILY IDLE COSTS:", globalVehicleFixedParams + globalDriverFixedParams + periodAdminFixedCosts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
