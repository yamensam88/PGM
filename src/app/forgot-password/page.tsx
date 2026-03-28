"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("email", email);

      const res = await requestPasswordReset(formData);
      
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Une erreur est survenue.");
      }
    } catch (err: any) {
      setError("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

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
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation sécurisé.
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-zinc-100 sm:rounded-xl sm:px-10">
          
          {success ? (
            <div className="text-center space-y-4">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">E-mail envoyé</h3>
               <p className="text-sm text-slate-500 mb-6">
                  Si le compte existe, un e-mail contenant les instructions a été envoyé à <strong>{email}</strong>.
               </p>
               <Link href="/login" className="mt-4 w-full inline-flex justify-center items-center h-12 border border-slate-300 rounded-lg shadow-sm text-[15px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                 Retour à la connexion
               </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[15px] font-semibold text-[#334155]">Adresse e-mail</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-zinc-300 focus-visible:ring-1 focus-visible:ring-blue-500 px-3 text-base rounded-lg"
                  />
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
                  className="w-full flex justify-center items-center h-12 border border-transparent rounded-lg shadow-sm text-[15px] font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Envoi en cours..." : "Recevoir le lien"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
