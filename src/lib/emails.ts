import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_api_key");
const fromEmail = "TransportOS <onboarding@resend.dev>"; 
// Note: onboarding@resend.dev can only send to the verified Resend account email for testing.

export async function sendWelcomeEmail(to: string, ownerName: string, orgName: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Bienvenue sur PGM, ${ownerName} !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #0A2540;">Bienvenue sur PGM (Pilotage Gestion Maîtrise)</h2>
           <p>Bonjour ${ownerName},</p>
           <p>Nous sommes ravis d'accueillir <strong>${orgName}</strong> sur notre plateforme.</p>
           <p>Votre période d'essai de 7 jours vient de commencer. Vous avez maintenant accès à l'ensemble de nos fonctionnalités d'exploitation, de suivi RH et de pilotage financier.</p>
           <div style="margin: 30px 0;">
             <a href="${appUrl}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accéder à mon espace</a>
           </div>
           <p>Si vous avez la moindre question, n'hésitez pas à répondre directement à cet e-mail.</p>
           <p>À très vite sur PGM !</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Erreur sendWelcomeEmail:", error);
  }
}

export async function sendTrialWarningEmail(to: string, ownerName: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "⚠️ Il ne vous reste que 48h d'essai sur PGM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #ea580c;">Votre essai gratuit expire bientôt</h2>
           <p>Bonjour ${ownerName},</p>
           <p>Votre période d'essai gratuit sur PGM prend fin dans <strong>48 heures</strong>.</p>
           <p>Pour continuer à utiliser la plateforme sans interruption de service, pensez à configurer votre facturation dès maintenant.</p>
           <div style="margin: 30px 0;">
             <a href="${appUrl}/dispatch/settings/billing" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Configurer ma facturation</a>
           </div>
        </div>
      `
    });
  } catch (error) {
    console.error("Erreur sendTrialWarningEmail:", error);
  }
}

export async function sendRenewalWarningEmail(to: string, ownerName: string, daysLeft: number) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Information : Renouvellement de votre abonnement PGM dans ${daysLeft} jours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #2563eb;">Renouvellement imminent</h2>
           <p>Bonjour ${ownerName},</p>
           <p>Nous vous informons que votre abonnement PGM se renouvellera automatiquement dans <strong>${daysLeft} jours</strong>.</p>
           <p>Vous n'avez aucune action à effectuer si vous souhaitez conserver votre offre actuelle.</p>
           <div style="margin: 30px 0;">
             <a href="${appUrl}/dispatch/settings/billing" style="background-color: #f1f5f9; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; border: 1px solid #cbd5e1;">Gérer mon abonnement</a>
           </div>
        </div>
      `
    });
  } catch (error) {
    console.error("Erreur sendRenewalWarningEmail:", error);
  }
}

export async function sendInvoiceEmail(to: string, ownerName: string, amount: number) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Votre reçu de paiement PGM (${amount}€)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #10b981;">Paiement confirmé</h2>
           <p>Bonjour ${ownerName},</p>
           <p>Nous avons bien reçu votre paiement de <strong>${amount}€</strong> pour votre abonnement PGM.</p>
           <p>Vous retrouverez votre facture téléchargeable directement dans votre espace client.</p>
           <p>Merci pour votre confiance !</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Erreur sendInvoiceEmail:", error);
  }
}
