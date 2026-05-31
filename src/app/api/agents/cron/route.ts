import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeDailyAnomalies } from '@/lib/agents/technicalAgent';

export async function POST(req: Request) {
  try {
    // SÉCURITÉ : authentification obligatoire (Bearer CRON_SECRET ou en-tête x-pgm-secret).
    const authHeader = req.headers.get('authorization');
    const pgmSecret = req.headers.get('x-pgm-secret');
    const okBearer = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const okPgm = !!process.env.PGM_WEBHOOK_SECRET && pgmSecret === process.env.PGM_WEBHOOK_SECRET;
    if (!okBearer && !okPgm) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const orgId = body.organization_id;

    if (!orgId) {
      return NextResponse.json({ error: "organization_id est requis" }, { status: 400 });
    }

    // 1. Collecter des "anomalies" de la base de données.
    // Exemple : les courses d'aujourd'hui qui sont "en cours" depuis plus de 8 heures
    // Ou celles avec un productivity_index très bas.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const problematicRuns = await prisma.dailyRun.findMany({
      where: {
        organization_id: orgId,
        date: { gte: today },
        OR: [
          { status: 'in_progress' }, // Potentiellement coincée si la journée touche à sa fin
          { productivity_index: { lt: 0.5 } } // Productivité anormalement basse
        ]
      },
      select: {
        id: true,
        run_code: true,
        status: true,
        productivity_index: true,
        margin_net: true,
        driver: { select: { first_name: true, last_name: true } }
      },
      take: 10
    });

    if (problematicRuns.length === 0) {
      return NextResponse.json({ message: "Aucune anomalie détectée aujourd'hui." });
    }

    // 2. Faire analyser par l'Agent IA
    const aiReportText = await analyzeDailyAnomalies(problematicRuns);

    // 3. Enregistrer l'analyse dans la base de données
    const savedReport = await prisma.aiReport.create({
      data: {
        organization_id: orgId,
        report_type: 'anomaly',
        report_period_start: today,
        report_period_end: new Date(),
        generated_text: aiReportText || 'Erreur lors de la génération.',
        structured_data_json: problematicRuns
      }
    });

    // 4. (Optionnel mais demandé) Envoyer une notification interne au Dispatch
    // Pour l'instant on se connecte via la table InternalMessage si on veut que ça s'affiche en cloche.
    
    // On trouve le premier admin/dispatch pour l'envoyer depuis l'IA
    const aiSender = await prisma.user.findFirst({
        where: { organization_id: orgId, role: 'admin' }
    });

    if (aiSender) {
        await prisma.internalMessage.create({
            data: {
                organization_id: orgId,
                sender_id: aiSender.id,
                group_room: 'dispatch',
                content: `⚠️ [Alerte IA] Nouvelles anomalies détectées :\n\n${aiReportText}`
            }
        });
    }

    return NextResponse.json({ success: true, report_id: savedReport.id });

  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
