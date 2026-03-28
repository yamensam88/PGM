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
          
          if (remainingDays === 2) {
             const owner = org.users[0];
             if (owner && owner.email) {
                await sendTrialWarningEmail(owner.email, owner.first_name || 'Propriétaire');
                trialAlertsSent++;
             }
          }
       }
    }

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
          renewalAlertsSent
       }
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
