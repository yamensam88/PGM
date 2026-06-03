"use client";

import { useMemo, useState } from "react";

const C = {
  bg: "#070b16", panel: "#121a30", panel2: "#0e1628", line: "#243456",
  ink: "#eaf0ff", muted: "#9fb0d4", accent: "#4f8cff", green: "#22d3a6",
  amber: "#f5b73d", red: "#ff6b6b", purple: "#9b7bff", gray: "#7d8ba8",
};

const fmt = (n: number, d: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("fr-FR", {
    minimumFractionDigits: d, maximumFractionDigits: d,
  });

type FieldProps = {
  label: string; unit: string; value: string;
  onChange: (v: string) => void;
};
function Field({ label, unit, value, onChange }: FieldProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 13, marginBottom: 5, color: "#cdd8f0" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="number" inputMode="numeric" value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", background: C.panel2, border: `1px solid ${C.line}`,
            borderRadius: 10, color: C.ink, fontSize: 17, fontWeight: 600,
            padding: "12px 44px 12px 13px", outline: "none",
          }}
        />
        <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.muted, pointerEvents: "none" }}>{unit}</span>
      </div>
    </div>
  );
}

function Card({ step, title, hint, children }: { step: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: C.accent, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-flex", width: 20, height: 20, borderRadius: "50%", background: C.accent, color: "#06122a", fontSize: 11, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>{step}</span>
        {title}
      </h2>
      {hint && <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 12 }}>{hint}</div>}
      {children}
    </div>
  );
}

export default function CalculateurPage() {
  const [nb, setNb] = useState("22");
  const [kmt, setKmt] = useState("340");
  const [carb, setCarb] = useState("1300");
  const [entr, setEntr] = useState("400");
  const [assu, setAssu] = useState("700");
  const [cond, setCond] = useState("2600");
  const [struct, setStruct] = useState("600");
  const [prix, setPrix] = useState("250");

  const r = useMemo(() => {
    const v = (s: string) => { const n = parseFloat(s); return isNaN(n) || n < 0 ? 0 : n; };
    const nbV = v(nb), kmtV = v(kmt), carbV = v(carb), entrV = v(entr), assuV = v(assu), condV = v(cond), structV = v(struct), prixV = v(prix);
    const kmMois = nbV * kmtV;
    const total = carbV + entrV + assuV + condV + structV;
    const coutKm = kmMois > 0 ? total / kmMois : 0;
    const coutT = nbV > 0 ? total / nbV : 0;
    const marge = prixV - coutT;
    const pct = prixV > 0 ? (marge / prixV) * 100 : 0;
    const margeMois = marge * nbV;
    const margeAn = margeMois * 12;
    const parts = [
      { n: "Carburant", val: carbV, c: C.amber },
      { n: "Entretien/péages", val: entrV, c: C.accent },
      { n: "Assur./amort.", val: assuV, c: C.purple },
      { n: "Conducteur", val: condV, c: C.green },
      { n: "Structure", val: structV, c: C.gray },
    ];
    return { kmMois, total, coutKm, coutT, marge, pct, margeMois, margeAn, parts };
  }, [nb, kmt, carb, entr, assu, cond, struct, prix]);

  const maxw = Math.max(r.total, 1);
  let vCls: "win" | "thin" | "loss";
  let vTitle: string, vTxt: React.ReactNode, vYear: React.ReactNode;
  const eu = `${r.marge >= 0 ? "+" : ""}${fmt(r.marge, 0)} €`;
  if (r.marge < 0) {
    vCls = "loss"; vTitle = "⚠️ Cette tournée vous coûte de l'argent.";
    vTxt = <>À ce prix, chaque tournée vous fait perdre <b>{eu}</b> — soit <b>{fmt(r.margeMois, 0)} € par mois</b> sur ce véhicule.</>;
    vYear = <>Sur un an : <b style={{ color: C.ink }}>{fmt(r.margeAn, 0)} €</b>. Et c&apos;est verrouillé pour toute la durée du marché.</>;
  } else if (r.pct < 5) {
    vCls = "thin"; vTitle = "🔶 Marge sous tension.";
    vTxt = <>Il vous reste <b>{eu}</b> par tournée, soit <b>{fmt(r.pct, 1)} %</b>. Une hausse de gazole ou un km à vide de plus, et vous basculez dans le rouge.</>;
    vYear = <>Sur un an : <b style={{ color: C.ink }}>{fmt(r.margeAn, 0)} €</b> de marge sur ce véhicule — fragile.</>;
  } else {
    vCls = "win"; vTitle = "✅ Cette tournée est rentable.";
    vTxt = <>Il vous reste <b>{eu}</b> par tournée ({fmt(r.pct, 1)} %). Reste à vérifier que TOUTES vos tournées tiennent ce niveau — c&apos;est rarement le cas.</>;
    vYear = <>Sur un an : <b style={{ color: C.ink }}>{fmt(r.margeAn, 0)} €</b> sur ce véhicule.</>;
  }
  const vColor = vCls === "loss" ? C.red : vCls === "thin" ? C.amber : C.green;
  const vBg = vCls === "loss" ? "rgba(255,107,107,.1)" : vCls === "thin" ? "rgba(245,183,61,.1)" : "rgba(34,211,166,.1)";
  const vBorder = vCls === "loss" ? "rgba(255,107,107,.5)" : vCls === "thin" ? "rgba(245,183,61,.5)" : "rgba(34,211,166,.45)";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "var(--font-geist-sans), system-ui, sans-serif", padding: 16 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#06122a", fontSize: 15 }}>PGM</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 0.5 }}>PGM</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Pilotage · Gestion · Maîtrise</div>
          </div>
        </div>

        <h1 style={{ fontSize: 23, lineHeight: 1.2, margin: "6px 0 8px", fontWeight: 800 }}>
          Votre tournée, vous la <span style={{ color: C.green }}>gagnez</span> ou vous la perdez ?
        </h1>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 12 }}>
          Calculez votre vrai coût de revient au kilomètre et par tournée. Adaptez les chiffres aux vôtres : le résultat se met à jour tout seul.
        </p>

        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "rgba(34,211,166,.08)", border: "1px solid rgba(34,211,166,.35)", borderRadius: 11, padding: "11px 13px", fontSize: 12.5, color: "#cfe9e0", marginBottom: 18 }}>
          <span style={{ flexShrink: 0, fontSize: 15 }}>🔒</span>
          <span><b style={{ color: C.green }}>100 % privé.</b> Tout est calculé sur votre appareil. Rien n&apos;est envoyé, rien n&apos;est enregistré, personne ne voit vos chiffres — pas même nous.</span>
        </div>

        <Card step="1" title="Votre activité" hint="Sur un mois type, pour un véhicule.">
          <Field label="Nombre de tournées par mois" unit="tournées" value={nb} onChange={setNb} />
          <Field label="Kilomètres moyens par tournée" unit="km" value={kmt} onChange={setKmt} />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Soit <b style={{ color: C.ink }}>{fmt(r.kmMois, 0)}</b> km / mois.</div>
        </Card>

        <Card step="2" title="Le véhicule (par mois)" hint="Au prix d'aujourd'hui, pas de l'an dernier.">
          <Field label="Carburant" unit="€" value={carb} onChange={setCarb} />
          <Field label="Entretien, pneus, péages" unit="€" value={entr} onChange={setEntr} />
          <Field label="Assurance + amortissement (ou location)" unit="€" value={assu} onChange={setAssu} />
        </Card>

        <Card step="3" title="Conducteur & structure (par mois)" hint="Le salaire chargé réel, et la part de vos frais généraux affectée à ce véhicule.">
          <Field label="Salaire chargé du conducteur" unit="€" value={cond} onChange={setCond} />
          <Field label="Quote-part de structure (expl., atelier, admin)" unit="€" value={struct} onChange={setStruct} />
        </Card>

        <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 16, padding: "20px 18px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, fontWeight: 700 }}>Votre coût de revient réel</div>
          <div style={{ display: "flex", gap: 12, margin: "8px 0 16px" }}>
            <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 13, textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.green, lineHeight: 1 }}>{fmt(r.coutKm, 2)}<small style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}> €/km</small></div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>au kilomètre</div>
            </div>
            <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 13, textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.green, lineHeight: 1 }}>{fmt(r.coutT, 0)}<small style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}> €</small></div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>par tournée</div>
            </div>
          </div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, fontWeight: 700, marginBottom: 8 }}>Où part votre argent</div>
          {r.parts.map((p) => {
            const pc = r.total > 0 ? Math.round((p.val / r.total) * 100) : 0;
            const w = Math.round((p.val / maxw) * 100);
            return (
              <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 6 }}>
                <span style={{ width: 104, color: C.muted, flexShrink: 0 }}>{p.n}</span>
                <span style={{ flex: 1, height: 9, background: C.panel2, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.line}` }}>
                  <span style={{ display: "block", height: "100%", borderRadius: 6, width: `${w}%`, background: p.c }} />
                </span>
                <span style={{ width: 38, textAlign: "right", color: "#cdd8f0", flexShrink: 0 }}>{pc}%</span>
              </div>
            );
          })}
        </div>

        <Card step="€" title="Et ce qu'on vous paie ?" hint="Entrez le prix que votre donneur d'ordre vous paie par tournée. (Ça reste sur votre écran.)">
          <Field label="Prix payé par tournée" unit="€" value={prix} onChange={setPrix} />
        </Card>

        <div style={{ borderRadius: 14, padding: "16px 16px", marginBottom: 14, border: `1px solid ${vBorder}`, background: vBg }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: vColor }}>{vTitle}</div>
          <p style={{ fontSize: 13, color: "#dde6fa" }}>{vTxt}</p>
          <div style={{ marginTop: 9, fontSize: 12.5, color: C.muted }}>{vYear}</div>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.accent}`, borderRadius: 16, padding: "20px 18px", textAlign: "center" }}>
          <h3 style={{ fontSize: 16, marginBottom: 7 }}>Ça, c&apos;est une estimation. PGM le fait pour de vrai.</h3>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Coût de revient et marge calculés automatiquement, tournée par tournée et véhicule par véhicule — en temps réel, sur vos données. Et une alerte dès qu&apos;une tournée passe sous le seuil.
          </p>
          <a href="/register" style={{ display: "block", background: C.accent, color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 15, padding: 15, borderRadius: 12 }}>
            Essayer gratuitement 7 jours →
          </a>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 10 }}>Sans carte bancaire · sans engagement · hébergé en Europe</div>
        </div>

        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "16px 4px 24px", lineHeight: 1.5 }}>
          Estimation indicative à partir des chiffres que vous saisissez. PGM est un outil d&apos;aide à la décision pensé pour les transporteurs et sous-traitants de la livraison. Vos saisies ne quittent jamais cet écran.
        </p>

      </div>
    </div>
  );
}
