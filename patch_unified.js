const fs = require('fs');

const path = 'C:/Users/Sami/.gemini/antigravity/scratch/saas_delivery/app/src/lib/actions.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /export async function saveUnifiedDelivery.*?return \{ success: false, error:.*?\}\n\}\n/s;

const newFunc = `export async function saveUnifiedDelivery(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const vehicleId = formData.get("vehicle_id") as string;
    const runIdsStr = formData.get("runIds") as string | null;
    const runStatsStr = formData.get("runStats") as string | null;

    if (!runIdsStr || !runStatsStr) {
      throw new Error("Données de livraison invalides");
    }

    const kmStart = Number(formData.get("km_start")) || 0;
    const kmEnd = Number(formData.get("km_end")) || 0;
    const fuelLiters = Number(formData.get("fuel_liters")) || 0;
    const fuelPriceStr = formData.get("fuel_price");
    const fuelPriceInput = fuelPriceStr ? Number(fuelPriceStr) : null;
    const fuelReceiptFile = formData.get("fuel_receipt") as File | null;

    let receiptUrl: string | null = null;
    if (fuelReceiptFile && fuelReceiptFile.size > 0) {
       receiptUrl = \`/uploads/\${orgId}/fuel/\${fuelReceiptFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}\`;
    }

    const runIds: string[] = JSON.parse(runIdsStr);
    const runStats: Record<string, { loaded: string, returned: string, relay: string, collected: string }> = JSON.parse(runStatsStr);

    let isFirstIteration = true;

    for (const id of runIds) {
      const stats = runStats[id] || { loaded: '0', returned: '0', relay: '0', collected: '0' };
      const loaded = Number(stats.loaded) || 0;
      const returned = Number(stats.returned) || 0;
      const relay = Number(stats.relay) || 0;
      const collected = Number(stats.collected) || 0;
      const delivered = Math.max(0, loaded - returned);

      const notes = \`Détails saisis via UnifiedApp: \${loaded}C/\${delivered}L/\${returned}R - Relais:\${relay} - Collectes:\${collected}\`;
      const routeNumber = formData.get("route_number") as string | null;

      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      
      const existingRun = await prisma.dailyRun.findUnique({ where: { id } });
      if (!existingRun) continue;

      let client = await prisma.client.findUnique({ where: { id: existingRun.client_id }, include: { rate_cards: true }});
      if (!client) throw new Error("Client manquant pour la tournée.");

      let rateCardToUse = client?.rate_cards?.[0];
      if (existingRun && existingRun.rate_card_id) {
         rateCardToUse = await prisma.rateCard.findUnique({ where: { id: existingRun.rate_card_id } }) || rateCardToUse;
      }

      const base_flat = Number(rateCardToUse?.base_daily_flat || 0);
      const price_stop = Number(rateCardToUse?.unit_price_stop || 0);
      const price_parcel = Number(rateCardToUse?.unit_price_package || 0);
      const bonus_relay = Number(rateCardToUse?.bonus_relay_point || 0);
      
      // Revenue definition
      const billed_parcels = loaded + relay;
      const revenue_calculated = base_flat + (price_stop * collected) + (price_parcel * billed_parcels) + (bonus_relay * relay);

      // Driver & Fleet Avoid Double Counting
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);

      let cost_driver = 0;
      let cost_vehicle = 0;
      let cost_fuel = 0;
      let km_diff = 0;
      let actual_fuel_price = 1.80;

      if (isFirstIteration) {
        const priorDriverRuns = await prisma.dailyRun.count({
          where: { driver_id: driverId, date: { gte: startOfDay, lte: endOfDay }, id: { not: id }, status: 'completed' }
        });
        cost_driver = priorDriverRuns > 0 ? 0 : Number(driver?.daily_base_cost || 0);

        const priorVehicleRuns = await prisma.dailyRun.count({
          where: { vehicle_id: vehicleId, date: { gte: startOfDay, lte: endOfDay }, id: { not: id }, status: 'completed' }
        });

        const base_fleet_cost = priorVehicleRuns > 0 ? 0 : (Number(vehicle?.fixed_monthly_cost || 0) + Number(vehicle?.rental_monthly_cost || 0) + Number(vehicle?.insurance_monthly_cost || 0)) / 30;
        km_diff = Math.max(0, kmEnd - kmStart);
        const variable_fleet_cost = km_diff * Number(vehicle?.internal_cost_per_km || 0);
        cost_vehicle = base_fleet_cost + variable_fleet_cost;
        
        if (fuelLiters > 0) {
          const org = await prisma.organization.findUnique({ where: { id: orgId } });
          actual_fuel_price = fuelPriceInput ? fuelPriceInput : (org?.settings_json ? ((org.settings_json as any).fuel_price_per_liter || 1.80) : 1.80);
          cost_fuel = fuelLiters * actual_fuel_price;
        }

        if (!receiptUrl) {
           const existingFuelLog = await prisma.fuelLog.findFirst({ where: { run_id: id } });
           if (existingFuelLog) receiptUrl = existingFuelLog.receipt_url;
        }
      }
      
      const margin_net = revenue_calculated - cost_driver - cost_vehicle - cost_fuel;

      const runData = {
        organization_id: orgId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        date: new Date(),
        status: 'completed',
        run_code: routeNumber && routeNumber.trim() !== '' ? routeNumber : (existingRun.run_code || null),
        km_start: kmStart,
        km_end: kmEnd,
        km_total: km_diff,
        fuel_consumed_liters: isFirstIteration ? fuelLiters : 0,
        packages_loaded: loaded,
        packages_returned: returned,
        packages_delivered: delivered,
        packages_relay: relay,
        stops_completed: collected,
        notes: notes,
        return_time: new Date(),
        revenue_calculated,
        cost_driver,
        cost_vehicle,
        cost_fuel,
        margin_net,
        client_id: client.id
      };

      const savedRun = await prisma.dailyRun.update({
        where: { id },
        data: runData
      });

      const operations = [];

      operations.push(prisma.fuelLog.deleteMany({ where: { run_id: savedRun.id } }));
      operations.push(prisma.financialEntry.deleteMany({ 
          where: { 
             run_id: savedRun.id, 
             category: { in: ['fuel_cost', 'delivery_revenue', 'driver_cost', 'vehicle_wear_cost'] } 
          } 
      }));

      if (isFirstIteration && fuelLiters > 0) {
         operations.push(prisma.fuelLog.create({
            data: {
              organization_id: orgId,
              vehicle_id: vehicleId,
              run_id: savedRun.id,
              total_cost: cost_fuel,
              liters: fuelLiters,
              price_per_liter: actual_fuel_price,
              fueled_at: new Date(),
              receipt_url: receiptUrl,
            }
         }));
      }

      const ledgerEntries = [
          {
            organization_id: orgId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            client_id: client.id,
            run_id: savedRun.id,
            entry_type: 'revenue',
            category: 'delivery_revenue',
            amount: revenue_calculated,
            entry_date: new Date(),
            description: \`Chiffre d'Affaires - Tournée \${savedRun.run_code || savedRun.id}\`
          }
      ];

      if (cost_driver > 0) {
          ledgerEntries.push({
            organization_id: orgId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            client_id: client.id,
            run_id: savedRun.id,
            entry_type: 'cost',
            category: 'driver_cost',
            amount: cost_driver,
            entry_date: new Date(),
            description: \`Coût Chauffeur - Tournée \${savedRun.run_code || savedRun.id}\`
          });
      }

      if (cost_vehicle > 0) {
          ledgerEntries.push({
            organization_id: orgId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            client_id: client.id,
            run_id: savedRun.id,
            entry_type: 'cost',
            category: 'vehicle_wear_cost',
            amount: cost_vehicle,
            entry_date: new Date(),
            description: \`Coût Véhicule (fixe + km) - Tournée \${savedRun.run_code || savedRun.id}\`
          });
      }

      if (cost_fuel > 0) {
          ledgerEntries.push({
            organization_id: orgId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            client_id: client.id,
            run_id: savedRun.id,
            entry_type: 'cost',
            category: 'fuel_cost',
            amount: cost_fuel,
            entry_date: new Date(),
            description: \`Fuel end of run \${savedRun.id}\`
          });
      }

      operations.push(prisma.financialEntry.createMany({
          data: ledgerEntries
      }));

      operations.push(prisma.eventsLog.create({
          data: {
            organization_id: orgId,
            run_id: savedRun.id,
            event_type: 'run_completed',
            metadata_json: {
               km_end: kmEnd, 
               stops_completed: collected, 
               revenue_calculated, 
               cost_vehicle, 
               cost_fuel,
               cost_driver,
               margin_net
            }
          }
      }));

      await prisma.$transaction(operations);
      
      isFirstIteration = false;
    }

    revalidatePath("/driver");
    revalidatePath("/driver/deliveries");
    revalidatePath("/dispatch/dashboard");
    revalidatePath("/dispatch/runs");
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur saveUnifiedDelivery:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de la livraison" };
  }
}
`;

content = content.replace(regex, newFunc);
fs.writeFileSync(path, content, 'utf8');
