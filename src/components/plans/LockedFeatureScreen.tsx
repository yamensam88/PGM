import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

/**
 * Écran affiché lorsqu'une interface n'est pas accessible avec l'accès courant
 * (période d'essai limitée à Direction + Exploitation, ou fonctionnalité hors palier).
 */
export function LockedFeatureScreen({
  title = "Disponible après souscription",
  message = "Cette interface n'est pas incluse dans votre accès actuel. Choisissez une offre pour la débloquer.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 bg-white border border-indigo-100 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto mt-12">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2">
        <Lock className="w-10 h-10" />
      </div>
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-slate-500 max-w-md mx-auto text-[15px] mt-3 leading-relaxed">{message}</p>
      </div>
      <Link
        href="/dispatch/settings/billing"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex justify-center items-center gap-2 mt-4 text-[15px]"
      >
        Voir les offres <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
