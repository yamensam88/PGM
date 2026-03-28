"use server";

import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function requestPasswordReset(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    if (!email) throw new Error("Adresse e-mail requise.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
       // Avoid leaking if user exists. Just return success silently.
       return { success: true }; 
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token: resetToken, reset_token_expires: resetTokenExpires }
    });

    // Default to app domain or localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: 'TransportOS <onboarding@resend.dev>',
      to: email, // Note: with free Resend account, you can only send to your verified domain or registered email address.
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
           <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
           <p>Bonjour ${user.first_name || 'utilisateur'},</p>
           <p>Vous avez demandé à réinitialiser le mot de passe de votre compte TransportOS.</p>
           <p>Cliquez sur le bouton ci-dessous pour configurer un nouveau mot de passe :</p>
           <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">Réinitialiser mon mot de passe</a>
           <p>Ce lien de sécurité expirera dans une heure.</p>
           <p style="color: #666; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail. Votre mot de passe actuel restera inchangé.</p>
        </div>
      `
    });

    return { success: true };
  } catch (err: any) {
    console.error("Erreur requestPasswordReset:", err);
    return { success: false, error: "Impossible d'envoyer l'e-mail pour le moment." };
  }
}

export async function performPasswordReset(formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    if (!token || !password) throw new Error("Paramètres manquants.");
    if (password.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");

    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() }
      }
    });

    if (!user) throw new Error("Ce lien de réinitialisation est invalide ou a expiré.");

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      }
    });

    return { success: true };
  } catch (err: any) {
    console.error("Erreur performPasswordReset:", err);
    return { success: false, error: err.message || "Erreur lors de la réinitialisation de votre mot de passe." };
  }
}
