/**
 * headcount.ts — Source de verite UNIQUE pour l'effectif chauffeur (RH + Exploitation).
 *
 * Objectif : que la RH et l'Exploitation affichent EXACTEMENT le meme effectif pour une
 * meme date/periode. On unifie ici (1) le perimetre "chauffeur operationnel" et (2) la
 * logique presents/conges/absents/non-affectes, toujours calculee sur la PERIODE choisie.
 */

export type HeadcountDriver = {
  id: string;
  status?: string | null;
  job_title?: string | null;
  hr_events?: Array<{ event_type: string; start_date: any; end_date?: any | null }>;
};

/** Un "chauffeur operationnel" = poste "Chauffeur" OU poste non renseigne (defaut historique). */
export function isOperationalDriver(d: HeadcountDriver): boolean {
  return d.job_title === "Chauffeur" || !d.job_title;
}

export interface Headcount {
  actifs: number;
  presents: number;
  absents: number;
  conges: number;
  nonAffectes: number;
  activeList: HeadcountDriver[];
  presentsSet: Set<string>;
  congesSet: Set<string>;
  absentsSet: Set<string>;
  nonAffectesSet: Set<string>;
}

/**
 * @param drivers      tous les chauffeurs (avec leurs hr_events) — le filtre operationnel est applique ici.
 * @param runDriverIds ids des chauffeurs ayant une tournee (non annulee) sur la periode.
 * @param startDate/endDate periode selectionnee.
 */
export function computeChauffeurHeadcount(params: {
  drivers: HeadcountDriver[];
  runDriverIds: Iterable<string>;
  startDate: Date;
  endDate: Date;
}): Headcount {
  const { drivers, runDriverIds, startDate, endDate } = params;
  const overlaps = (e: { start_date: any; end_date?: any | null }) =>
    new Date(e.start_date) <= endDate && (e.end_date ? new Date(e.end_date) : new Date(e.start_date)) >= startDate;

  const active = drivers.filter((d) => d.status === "active" && isOperationalDriver(d));
  const activeIds = new Set(active.map((d) => d.id));

  const runIds = [...runDriverIds].filter((id) => activeIds.has(id));
  const manualPresent = active
    .filter((d) => (d.hr_events || []).some((e) => e.event_type === "presence" && overlaps(e)))
    .map((d) => d.id);
  const presentsSet = new Set<string>([...runIds, ...manualPresent]);

  const congesSet = new Set<string>(
    active
      .filter((d) => !presentsSet.has(d.id) && (d.hr_events || []).some((e) => e.event_type === "vacation" && overlaps(e)))
      .map((d) => d.id)
  );

  const absentsSet = new Set<string>(
    active
      .filter(
        (d) =>
          !presentsSet.has(d.id) &&
          !congesSet.has(d.id) &&
          (d.hr_events || []).some((e) => ["absence", "sick_leave"].includes(e.event_type) && overlaps(e))
      )
      .map((d) => d.id)
  );

  const nonAffectesSet = new Set<string>(
    active.filter((d) => !presentsSet.has(d.id) && !absentsSet.has(d.id) && !congesSet.has(d.id)).map((d) => d.id)
  );

  return {
    actifs: active.length,
    presents: presentsSet.size,
    absents: absentsSet.size,
    conges: congesSet.size,
    nonAffectes: nonAffectesSet.size,
    activeList: active,
    presentsSet,
    congesSet,
    absentsSet,
    nonAffectesSet,
  };
}
