"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Rafraichit automatiquement la page Suivi Livraisons pour refleter les
 * dernieres alertes envoyees par l'agent PGM (sans rechargement manuel).
 */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [last, setLast] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setLast(new Date());
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  const hh = last.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
      <RefreshCw className="w-3 h-3 text-emerald-500" />
      Actualisation auto · {hh}
    </span>
  );
}
