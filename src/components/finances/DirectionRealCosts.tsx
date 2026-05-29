import { updateRealCosts } from "@/lib/actions";

function CF({ name, label, def }: { name: string; label: string; def: number }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        step="0.01"
        name={name}
        defaultValue={Number(def || 0)}
        className="w-full h-9 rounded-lg border border-indigo-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

export function DirectionRealCosts({ settings, realCosts }: { settings: any; realCosts: any }) {
  const s = settings || {};
  const r = realCosts || {};
  const v = (k: string, fb: number) => (r[k] != null ? Number(r[k]) : s[k] != null ? Number(s[k]) : fb);
  return (
    <form action={updateRealCosts} className="border border-indigo-100 rounded-xl p-4 bg-white shadow-sm">
      <h3 className="font-bold text-slate-900 mb-1">Vrais couts d&apos;exploitation (mensuels)</h3>
      <p className="text-[11px] text-slate-400 mb-3">Valeurs reelles (non gonflees) &mdash; utilisees uniquement dans ce cockpit.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CF name="cost_rent" label="Loyer / entrepot &euro;" def={v("cost_rent", 4500)} />
        <CF name="cost_office_salaries" label="Salaires bureau & direction &euro;" def={v("cost_office_salaries", 8000)} />
        <CF name="cost_admin_vehicles" label="Vehicules admin &euro;" def={v("cost_admin_vehicles", 850)} />
        <CF name="cost_software" label="Logiciels / telecoms &euro;" def={v("cost_software", 350)} />
        <CF name="cost_insurances" label="Assurances &euro;" def={v("cost_insurances", 200)} />
        <CF name="cost_fees" label="Honoraires &euro;" def={v("cost_fees", 400)} />
        <CF name="cost_others" label="Autres frais fixes &euro;" def={v("cost_others", 500)} />
        <CF name="fuel_price_per_km" label="Gasoil / km &euro;" def={v("fuel_price_per_km", 0.18)} />
        <CF name="fuel_price_per_liter" label="Gasoil / L &euro;" def={v("fuel_price_per_liter", 1.8)} />
      </div>
      <button type="submit" className="mt-3 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">
        Enregistrer les vrais couts
      </button>
    </form>
  );
}
