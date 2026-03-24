import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "votre@email.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis.");
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Aucun compte trouvé avec cet email.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          throw new Error("Mot de passe incorrect.");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id,
          first_name: user.first_name,
          last_name: user.last_name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.role = user.role;
        token.organization_id = user.organization_id;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.organization_id = token.organization_id;
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development", // In a real app, ALWAYS set this in .env
};
