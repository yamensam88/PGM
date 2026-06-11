export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { sendTrialWarningEmail, sendRenewalWarningEmail } from "@/lib/emails";

// This route receives a GET request every day from a Cron Job Service (like Vercel Cron)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const now = new Date();
    
    // --- TASK 1: J-2 TRIAL WARNINGS ---
    const trialingOrgs = await prisma.organization.findMany({
      where: { subscription_status: 'trialing' },
      include: { users: { where: { role: 'owner' } } }
    });

    let trialAlertsSent = 0;
    for (const org of trialingOrgs) {
       if (org.created_at) {
          const trialEndMs = org.created_at.getTime() + (7 * 24 * 60 * 60 * 1000);
          const remainingMs = trialEndMs - now.getTime();
          const remainingDays = Math.ceil(remainingMs / (1000 * 3600 * 24));
          
          // fix R3 : fenêtre J-2..J-1 (>= 1 && <= 2) au lieu de l'égalité stricte === 2,
          // pour ne pas perdre l'alerte si le cron saute un jour. NB : sans table de dédup,
          // l'email peut partir 2 jours de suite (acceptable : mieux 2 emails que 0).
          if (remainingDays >= 1 && remainingDays <= 2) {
             const owner = org.users[0];
             if (owner && owner.email) {
                await sendTrialWarningEmail(owner.email, owner.first_name || 'Propriétaire');
                trialAlertsSent++;
             }
          }
       }
    }

    // --- TASK 1b: EXPIRE LES ESSAIS DÉPASSÉS (fix P0-04) ---
    // L'essai dure 7 jours (created_at + 7j). Au-delà, si l'org est ENCORE "trialing"
    // (donc jamais convertie en payante), on bascule son statut sur "expired" (non-payant).
    // Garde de sécurité : on ne touche QUE les orgs réellement en trialing dont created_at
    // est dépassé — jamais une org active/past_due/canceled.
    const trialCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const expiredTrials = await prisma.organization.updateMany({
      where: {
        subscription_status: 'trialing',
        created_at: { lte: trialCutoff },
      },
      data: { subscription_status: 'expired' },
    });
    const trialsExpired = expiredTrials.count;

    // --- TASK 2: J-7 RENEWAL WARNINGS ---
    const activeOrgs = await prisma.organization.findMany({
      where: { subscription_status: 'active' },
      include: { users: { where: { role: 'owner' } } }
    });

    let renewalAlertsSent = 0;
    for (const org of activeOrgs) {
       const settings = typeof org.settings_json === 'string' 
          ? JSON.parse(org.settings_json) 
          : (org.settings_json as any || {});
       
       if (settings?.current_period_end) {
          const endMs = new Date(settings.current_period_end).getTime();
          const remainingMs = endMs - now.getTime();
          const remainingDays = Math.ceil(remainingMs / (1000 * 3600 * 24));
          
          if (remainingDays === 7) {
             const owner = org.users[0];
             if (owner && owner.email) {
                await sendRenewalWarningEmail(owner.email, owner.first_name || 'Propriétaire', remainingDays);
                renewalAlertsSent++;
             }
          }
       }
    }

    return NextResponse.json({ 
       success: true, 
       message: "Cron executed successfully",
       stats: {
          trialAlertsSent,
          trialsExpired,
          renewalAlertsSent
       }
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
