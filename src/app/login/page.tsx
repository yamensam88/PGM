"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentative de connexion avec:", email);
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setLoading(false);

      if (!res?.error) {
        // Rediriger vers la racine, le middleware se chargera de la bonne route selon le rôle
        window.location.href = "/";
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } catch (err: any) {
      console.error("Erreur auth:", err);
      setLoading(false);
      setError("Une erreur inattendue s'est produite.");
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[15px] font-semibold text-[#334155]">Identifiant</Label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border-zinc-300 focus-visible:ring-1 focus-visible:ring-blue-500 px-3 text-base rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[15px] font-semibold text-[#334155]">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 border-zinc-300 focus-visible:ring-1 focus-visible:ring-blue-500 px-3 text-base rounded-lg"
          />
        </div>
        <div className="flex justify-end pt-1">
          <Link href="/forgot-password" className="text-[13px] font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center items-center h-12 border border-transparent rounded-lg shadow-sm text-[15px] font-medium text-slate-900 bg-[#2563eb] hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-6">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center">
            <span className="text-4xl font-extrabold tracking-tight text-[#0A2540]">
              PGM
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500 tracking-wide uppercase">
            Pilotage • Gestion • Maîtrise
          </p>
          <p className="mt-2 text-xs text-slate-500 text-center max-w-xs">
            Pilotez et maîtrisez votre activité transport en temps réel
          </p>
        </div>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-zinc-100 sm:rounded-xl sm:px-10">
          <Suspense fallback={<div className="text-center py-4 text-slate-500">Chargement...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
