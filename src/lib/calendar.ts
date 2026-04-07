/**
 * Moteur de calcul du calendrier français
 * Permet de déterminer avec précision les jours fériés et d'en déduire les jours ouvrables.
 */

// Calcule la date de Pâques selon l'algorithme "Computus" (Meeus/Jones/Butcher)
export function getEasterDate(year: number): Date {
  const f = Math.floor,
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);
  
  // Create date at noon to avoid timezone shift issues
  return new Date(year, month - 1, day, 12, 0, 0);
}

// Renvoie un Set contenant les dates des jours fériés d'une année sous format 'YYYY-MM-DD'
export function getFrenchHolidays(year: number): Set<string> {
  const holidays = [
    new Date(year, 0, 1, 12),   // 1er Janvier (Jour de l'an)
    new Date(year, 4, 1, 12),   // 1er Mai (Fête du travail)
    new Date(year, 4, 8, 12),   // 8 Mai (Victoire 1945)
    new Date(year, 6, 14, 12),  // 14 Juillet (Fête nationale)
    new Date(year, 7, 15, 12),  // 15 Août (Assomption)
    new Date(year, 10, 1, 12),  // 1er Novembre (Toussaint)
    new Date(year, 10, 11, 12), // 11 Novembre (Armistice)
    new Date(year, 11, 25, 12), // 25 Décembre (Noël)
  ];

  const easter = getEasterDate(year);
  
  // Lundi de Pâques (+1 jour par rapport à Pâques)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push(easterMonday);
  
  // Jeudi de l'Ascension (+39 jours)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  holidays.push(ascension);
  
  // Lundi de Pentecôte (+50 jours)
  const pentecote = new Date(easter);
  pentecote.setDate(easter.getDate() + 50);
  holidays.push(pentecote);

  // Return formatted YYYY-MM-DD strings using local timezone
  return new Set(holidays.map(d => {
     const mm = String(d.getMonth() + 1).padStart(2, '0');
     const dd = String(d.getDate()).padStart(2, '0');
     return `${year}-${mm}-${dd}`;
  }));
}

/**
 * Compte le nombre de JOURS OUVRÉS/OUVRABLES purs entre deux dates (incluses).
 * @param excludeSundays - Vrai par défaut, exclut tous les dimanches.
 * @param excludeHolidays - Vrai par défaut, exclut tous les jours fériés français.
 */
export function countWorkingDays(startDate: Date, endDate: Date, excludeSundays: boolean = true, excludeHolidays: boolean = true): number {
  let count = 0;
  // Start at Midnight local to avoid mid-day jumps
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 12, 0, 0);
  
  const yearsWithHolidays = new Map<number, Set<string>>();

  while (current <= end) {
    const year = current.getFullYear();
    if (!yearsWithHolidays.has(year) && excludeHolidays) {
      yearsWithHolidays.set(year, getFrenchHolidays(year));
    }
    
    const dayOfWeek = current.getDay();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateString = `${year}-${mm}-${dd}`;
    
    let isHoliday = false;
    if (excludeHolidays) {
      isHoliday = yearsWithHolidays.get(year)?.has(dateString) || false;
    }
    
    const isSunday = dayOfWeek === 0;

    if (!(excludeSundays && isSunday) && !isHoliday) {
      count++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  // Ensure we never return 0 if the filter makes mathematical sense to at least provide 1 scale step, 
  // but strictly speaking, spanning a single Sunday returns 0 working days.
  return count;
}
