"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/lib/actions";

export function CheckoutButton({
  tier,
  interval,
  label,
  className,
  portal,
}: {
  tier?: string;
  interval?: "monthly" | "annual";
  label: string;
  className?: string;
  portal?: boolean;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const go = () => {
    if (pending) return;
    setErr(null);
    start(async () => {
      const res = portal
        ? await createPortalSession()
        : await createCheckoutSession(tier || "", interval || "monthly");
      if (res?.ok && res.url) {
        window.location.href = res.url;
      } else {
        setErr(res?.error || "Erreur paiement.");
      }
    });
  };

  return (
    <>
      <button type="button" onClick={go} disabled={pending} className={className}>
        {pending ? "…" : label}
      </button>
      {err && <span className="block text-[11px] font-medium text-rose-600 mt-1">{err}</span>}
    </>
  );
}
