import { updateRealRate } from "@/lib/actions";

function RealField({ name, label, def }: { name: string; label: string; def: number }) {
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

export function DirectionRealPrices({
  clients,
  realRates,
}: {
  clients: any[];
  realRates: Record<string, any>;
}) {
  if (!clients || clients.length === 0) {
    return <p className="text-sm text-slate-500">Aucun client configure.</p>;
  }
  return (
    <div className="space-y-4">
      {clients.map((c) => {
        const disp = (c.rate_cards && c.rate_cards[0]) || {};
        const real = (realRates && realRates[c.id]) || {};
        const v = (k: string) => (real[k] != null ? Number(real[k]) : Number(disp[k] || 0));
        return (
          <form
            key={c.id}
            action={updateRealRate}
            className="border border-indigo-100 rounded-xl p-4 bg-white shadow-sm"
          >
            <input type="hidden" name="client_id" value={c.id} />
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 gap-1">
              <h3 className="font-bold text-slate-900">{c.name}</h3>
              <span className="text-[11px] text-slate-400">
                Affiche (equipe) : forfait {Number(disp.base_daily_flat || 0).toFixed(2)}&euro; &middot; colis{" "}
                {Number(disp.unit_price_package || 0).toFixed(2)}&euro; &middot; collecte{" "}
                {Number(disp.unit_price_stop || 0).toFixed(2)}&euro; &middot; relais{" "}
                {Number(disp.bonus_relay_point || 0).toFixed(2)}&euro;
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <RealField name="base_daily_flat" label="Vrai forfait jour &euro;" def={v("base_daily_flat")} />
              <RealField name="unit_price_package" label="Vrai prix colis &euro;" def={v("unit_price_package")} />
              <RealField name="unit_price_stop" label="Vraie collecte &euro;" def={v("unit_price_stop")} />
              <RealField name="bonus_relay_point" label="Vrai colis relais &euro;" def={v("bonus_relay_point")} />
            </div>
            <button
              type="submit"
              className="mt-3 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Enregistrer les vrais prix
            </button>
          </form>
        );
      })}
    </div>
  );
}
