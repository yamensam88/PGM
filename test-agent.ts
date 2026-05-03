import { analyzeDailyAnomalies } from './src/lib/agents/technicalAgent';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log("Recherche de tournées dans la base de données...");
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.log("Aucune organisation trouvée.");
        return;
    }
    
    // Pour le test, on prend 3 courses récentes pour voir comment l'IA réagit
    const problematicRuns = await prisma.dailyRun.findMany({
      where: { organization_id: org.id },
      select: {
        run_code: true,
        status: true,
        productivity_index: true,
        margin_net: true,
        driver: { select: { first_name: true, last_name: true } }
      },
      take: 3
    });

    if (problematicRuns.length === 0) {
        console.log("Aucune course trouvée dans la base de données.");
        return;
    }

    console.log(`Trouvé ${problematicRuns.length} courses. Envoi à l'Agent Gemini...`);
    
    const report = await analyzeDailyAnomalies(problematicRuns);
    
    console.log("\n================ RAPPORT GÉNÉRÉ PAR L'IA ================\n");
    console.log(report);
    console.log("\n=========================================================\n");
}

test().catch(console.error).finally(() => prisma.$disconnect());
