"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { performPasswordReset } from "@/lib/auth-actions";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
     return (
        <div className="text-center space-y-4">
           <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-slate-900">Lien invalide</h3>
           <p className="text-sm text-slate-500 mb-6">
              Ce lien de réinitialisation est introuvable ou a expiré. Veuillez refaire une demande.
           </p>
           <Link href="/forgot-password" className="mt-4 w-full inline-flex justify-center items-center h-12 border border-slate-300 rounded-lg shadow-sm text-[15px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
             Demander un nouveau lien
           </Link>
        </div>
     );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
       setError("Le mot de passe doit faire au moins 6 caractères.");
       setLoading(false);
       return;
    }

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);

      const res = await performPasswordReset(formData);
      
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
           router.push("/login");
        }, 3000);
      } else {
        setError(res.error || "Une erreur est survenue.");
      }
    } catch (err: any) {
      setError("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
     return (
        <div className="text-center space-y-4">
           <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
           </div>
           <h3 className="text-lg font-bold text-slate-900">Mot de passe modifié !</h3>
           <p className="text-sm text-slate-500 mb-6">
              Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
           </p>
           <Link href="/login" className="mt-4 w-full inline-flex justify-center items-center h-12 border border-slate-300 rounded-lg shadow-sm text-[15px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
             Se connecter maintenant
           </Link>
        </div>
     );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[15px] font-semibold text-[#334155]">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 border-zinc-300 focus-visible:ring-1 focus-visible:ring-blue-500 px-3 text-base rounded-lg"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">6 caractères minimum</p>
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
          className="w-full flex justify-center items-center h-12 border border-transparent rounded-lg shadow-sm text-[15px] font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Sauvegarde..." : "Réinitialiser mon mot de passe"}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link href="/login" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Retour à la connexion
      </Link>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-6">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center">
            <span className="text-4xl font-extrabold tracking-tight text-[#0A2540]">
              PGM
            </span>
          </div>
          <h2 className="mt-4 text-center text-xl font-bold text-slate-900">
            Créer un nouveau mot de passe
          </h2>
          <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">
            Sécurisez votre compte avec un nouveau mot de passe robuste.
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-zinc-100 sm:rounded-xl sm:px-10">
          <Suspense fallback={<div className="text-center py-4 text-slate-500">Vérification du lien...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
