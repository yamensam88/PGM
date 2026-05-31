/**
 * leave.ts — Source unique du solde de congés payés.
 * Base acquise (paid_leave_balance) + acquisition +2,08 j/mois depuis la date de référence
 * (ou la date d'embauche), moins les congés réellement pris (en jours, bornes incluses).
 */
export function calculateLeaveBalance(driver: any): number {
  const baseVacation = Number(driver?.paid_leave_balance || 0);
  const refDateStr = driver?.paid_leave_reference_date || driver?.hire_date || null;
  let accruedDays = 0;
  let cutoffDate = new Date(0);
  if (refDateStr) {
    const ref = new Date(refDateStr);
    cutoffDate = ref;
    const diff = Date.now() - ref.getTime();
    if (diff > 0) accruedDays = (diff / (1000 * 60 * 60 * 24 * 30.436875)) * 2.08;
  }
  const totalBase = baseVacation + accruedDays;
  const consumed = (driver?.hr_events || [])
    .filter((e: any) => e.event_type === "vacation" && new Date(e.start_date) >= cutoffDate)
    .reduce((sum: number, e: any) => {
      const s = new Date(e.start_date);
      const en = e.end_date ? new Date(e.end_date) : s;
      const d = Math.max(0, en.getTime() - s.getTime());
      return sum + Math.ceil(d / (1000 * 60 * 60 * 24)) + 1;
    }, 0);
  return Math.max(0, totalBase - consumed);
}
