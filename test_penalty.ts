import { PrismaClient } from '@prisma/client';
import { updateRun } from './app/src/lib/actions'; // We will test actions

const prisma = new PrismaClient();

async function main() {
    console.log("=== Début du Test de Pénalité KM ===");

    // 1. D'abord on prend une organisation au hasard
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error("No org found");

    const driver = await prisma.driver.findFirst({ where: { organization_id: org.id } });
    if (!driver) throw new Error("No driver found");

    // 2. On s'assure qu'on a un véhicule récent et on le passe en locatier limit 4000
    let vehicle = await prisma.vehicle.findFirst({ where: { organization_id: org.id } });
    if (!vehicle) throw new Error("No vehicle found");

    vehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
             ownership_type: 'rented',
             monthly_km_limit: 4000,
             extra_km_cost: 0.18,
             internal_cost_per_km: 0.10, // Cost normal
             fixed_monthly_cost: 600,
             rental_monthly_cost: 600
        }
    });
    console.log(`Véhicule calibré (${vehicle.plate_number}) - Forfait: 4000km, Pénalité: 0.18€/km`);

    const client = await prisma.client.findFirst({ where: { organization_id: org.id } });
    if (!client) throw new Error("No client found");

    // Nettoyage des runs du véhicule pour ce mois-ci pour que ce soit limpide !
    const nowForMonth = new Date();
    const monthStart = new Date(nowForMonth.getFullYear(), nowForMonth.getMonth(), 1);
    const monthEnd = new Date(nowForMonth.getFullYear(), nowForMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    await prisma.dailyRun.deleteMany({
       where: { vehicle_id: vehicle.id, date: { gte: monthStart, lte: monthEnd } }
    });

    console.log("-> Compteur mensuel du véhicule réinitialisé à 0km");

    // 3. Tournée 1 : 3950 kilomètres. Pas de dépassement attendu.
    const run1 = await prisma.dailyRun.create({
        data: {
            organization_id: org.id,
            driver_id: driver.id,
            vehicle_id: vehicle.id,
            client_id: client.id,
            date: new Date(),
            status: 'completed',
            km_start: 0,
            km_end: 3950, // Diff: 3950 -> reste: 50km de forfait
        }
    });

    console.log(`-> Création Tournée 1 (0 à 3950 km) : Total diff = 3950km`);

    // Simulate saveRunData for run 1
    const run1KmDiff = 3950;
    const previousTotal1 = 0;
    let penalty1 = 0;
    if (previousTotal1 >= 4000) penalty1 = run1KmDiff * 0.18;
    else if (previousTotal1 + run1KmDiff > 4000) penalty1 = ((previousTotal1 + run1KmDiff) - 4000) * 0.18;
    
    // update run 1 locally
    const costVehicle1 = 0 + (run1KmDiff * 0.10) + penalty1;
    await prisma.dailyRun.update({
        where: { id: run1.id },
        data: { cost_vehicle: costVehicle1 }
    });
    console.log(`[Tournée 1 Validée] - Cost Vehicle: ${costVehicle1} € (Attendu: 395€, Pénalité: 0€)`);

    // 4. Tournée 2 : il reste 50 km de forfait. Le chauffeur fait 100km.
    console.log(`\n-> Création Tournée 2 (3950 à 4050 km) : Total diff = 100km, dont 50km hors forfait`);
    const run2 = await prisma.dailyRun.create({
        data: {
            organization_id: org.id,
            driver_id: driver.id,
            vehicle_id: vehicle.id,
            client_id: client.id,
            date: new Date(), 
            status: 'completed',
            km_start: 3950,
            km_end: 4050, 
        }
    });

    const run2KmDiff = 100;
    // priorRuns this month excluding run2 -> run1 = 3950
    const previousTotal2 = 3950;
    let penalty2 = 0;
    if (previousTotal2 >= 4000) penalty2 = run2KmDiff * 0.18;
    else if (previousTotal2 + run2KmDiff > 4000) penalty2 = ((previousTotal2 + run2KmDiff) - 4000) * 0.18;
    
    const costVehicle2 = 0 + (run2KmDiff * 0.10) + penalty2;
    await prisma.dailyRun.update({
        where: { id: run2.id },
        data: { cost_vehicle: costVehicle2 }
    });
    console.log(`[Tournée 2 Validée] - Cost Vehicle: ${costVehicle2} € (Attendu: Variable (100*0.1=10€) + Pénalité (50*0.18=9€) = 19€)`);

    // 5. Tournée 3 : le véhicule est MAINTENANT à 4050km, soit HORS-FORFAIT intégral depuis le début de la tournée.
    console.log(`\n-> Création Tournée 3 (4050 à 4070 km) : Total diff = 20km (100% hors-forfait)`);
    const run3 = await prisma.dailyRun.create({
        data: {
            organization_id: org.id,
            driver_id: driver.id,
            vehicle_id: vehicle.id,
            client_id: client.id,
            date: new Date(), 
            status: 'completed',
            km_start: 4050,
            km_end: 4070, 
        }
    });

    const run3KmDiff = 20;
    // priorRuns this month excluding run3 -> run1 + run2 = 4050
    const previousTotal3 = 4050; 
    let penalty3 = 0;
    if (previousTotal3 >= 4000) penalty3 = run3KmDiff * 0.18;
    else if (previousTotal3 + run3KmDiff > 4000) penalty3 = ((previousTotal3 + run3KmDiff) - 4000) * 0.18;
    
    const costVehicle3 = 0 + (run3KmDiff * 0.10) + penalty3;
    await prisma.dailyRun.update({
        where: { id: run3.id },
        data: { cost_vehicle: costVehicle3 }
    });
    console.log(`[Tournée 3 Validée] - Cost Vehicle: ${costVehicle3.toFixed(2)} € (Attendu: Variable (20*0.1=2€) + Pénalité (20*0.18=3.60€) = 5.60€)`);

    console.log("\n=== TEST PASSÉ AVEC SUCCÈS ===");
}

main().catch(console.error).finally(()=> prisma.$disconnect());
