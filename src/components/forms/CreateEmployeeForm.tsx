"use client";

import { useTransition, useState } from "react";
import { createEmployee } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key } from "lucide-react";

export function CreateEmployeeForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ isDriver: boolean; email?: string; password?: string } | null>(null);
  const [jobTitle, setJobTitle] = useState("Chauffeur");
  const [monthlyCost, setMonthlyCost] = useState("3500");

  // Fonction pour calculer les jours ouvrés (Lun-Sam) moins les jours fériés français
  const getAverageWorkingDaysPerMonth = (year: number) => {
      let workingDays = 0;
      
      const getHolidays = (y: number) => {
          const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
          const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
          const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
          const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
          const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
          const day = ((h + l - 7 * m + 114) % 31) + 1;
          
          const paques = new Date(y, month, day);
          return [
              new Date(y, 0, 1).getTime(),
              new Date(y, paques.getMonth(), paques.getDate() + 1).getTime(), // Lundi de Pâques
              new Date(y, 4, 1).getTime(),
              new Date(y, 4, 8).getTime(),
              new Date(y, paques.getMonth(), paques.getDate() + 39).getTime(), // Ascension
              new Date(y, paques.getMonth(), paques.getDate() + 50).getTime(), // Pentecôte
              new Date(y, 6, 14).getTime(),
              new Date(y, 7, 15).getTime(),
              new Date(y, 10, 1).getTime(),
              new Date(y, 10, 11).getTime(),
              new Date(y, 11, 25).getTime()
          ];
      };
      
      const holidays = getHolidays(year);
      
      for (let m = 0; m < 12; m++) {
          const daysInMonth = new Date(year, m + 1, 0).getDate();
          for (let d = 1; d <= daysInMonth; d++) {
              const date = new Date(year, m, d);
              if (date.getDay() !== 0 && !holidays.some(h => date.getTime() === h)) {
                  workingDays++;
              }
          }
      }
      return workingDays / 12;
  };

  const avgDaysPerMonth = getAverageWorkingDaysPerMonth(new Date().getFullYear());
  const calculatedDailyCost = monthlyCost && !isNaN(Number(monthlyCost)) 
      ? (Number(monthlyCost) / avgDaysPerMonth).toFixed(2) 
      : "0.00";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    setSuccessData(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createEmployee(formData);
        if (result.success) {
          setSuccessData({
            isDriver: Boolean((result as any).isDriver),
            email: (result as any).email,
            password: (result as any).password
          });
          // Reset form on success (simple way)
          (e.target as HTMLFormElement).reset();
        } else {
          setError((result as any).error || "Erreur lors de la création.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  if (successData) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-4">
        <h3 className="text-xl font-bold text-emerald-400">✅ Salarié ajouté avec succès !</h3>
        {successData.isDriver ? (
           <div className="space-y-4">
              <p className="text-emerald-500/80 text-[13px]">Le profil chauffeur a été créé, un accès spécifique a été généré automatiquement :</p>
              <div className="bg-[#f8f9fc] border border-slate-200 rounded-lg p-4 font-mono text-left max-w-sm mx-auto shadow-sm text-[13px] text-slate-600 space-y-2">
                 <p><strong className="text-slate-500">Identifiant :</strong> {successData.email}</p>
                 <p><strong className="text-slate-500">Mot de passe :</strong> {successData.password}</p>
              </div>
              <p className="text-[11px] text-orange-400 font-medium uppercase tracking-wider">Veuillez noter ces identifiants avant de fermer, ils ne seront plus affichés.</p>
           </div>
        ) : (
           <p className="text-emerald-500/80 text-[13px]">Le profil RH du salarié a été enregistré.</p>
        )}
        <Button onClick={() => setSuccessData(null)} variant="outline" className="mt-4 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900">Ajouter un autre salarié</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-[13px] font-medium text-slate-600">Prénom <span className="text-red-500">*</span></Label>
          <Input id="firstName" name="firstName" type="text" required className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" placeholder="Jean" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-[13px] font-medium text-slate-600">Nom <span className="text-red-500">*</span></Label>
          <Input id="lastName" name="lastName" type="text" required className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" placeholder="Dupont" />
        </div>
      </div>

      <div className="space-y-2">
         <Label htmlFor="phone" className="text-[13px] font-medium text-slate-600">Téléphone</Label>
         <Input id="phone" name="phone" type="tel" className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" placeholder="ex: 06 12 34 56 78" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle" className="text-[13px] font-medium text-slate-600">Poste <span className="text-red-500">*</span></Label>
        <Select name="jobTitle" value={jobTitle} onValueChange={(val) => setJobTitle(val || "Chauffeur")} required>
           <SelectTrigger className="w-full bg-white border-slate-200 text-slate-700 focus:ring-1 focus:ring-zinc-600">
              <SelectValue placeholder="Sélectionner le poste" />
           </SelectTrigger>
           <SelectContent className="bg-white border-slate-200 text-slate-700">
              <SelectItem value="Chauffeur" className="focus:bg-white focus:text-slate-900">Chauffeur (Accès App Driver automatique)</SelectItem>
              <SelectItem value="Exploitant" className="focus:bg-white focus:text-slate-900">Exploitant</SelectItem>
              <SelectItem value="Gestionnaire de flotte" className="focus:bg-white focus:text-slate-900">Gestionnaire de flotte</SelectItem>
              <SelectItem value="Chef de quai" className="focus:bg-white focus:text-slate-900">Chef de quai</SelectItem>
              <SelectItem value="Ressources Humaines" className="focus:bg-white focus:text-slate-900">Ressources Humaines</SelectItem>
              <SelectItem value="Assistant Administratif" className="focus:bg-white focus:text-slate-900">Assistant Administratif</SelectItem>
           </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employmentType" className="text-[13px] font-medium text-slate-600">Nature du contrat <span className="text-red-500">*</span></Label>
          <Select name="employmentType" defaultValue="CDI" required>
             <SelectTrigger className="w-full bg-white border-slate-200 text-slate-700 focus:ring-1 focus:ring-zinc-600">
                <SelectValue placeholder="Type" />
             </SelectTrigger>
             <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="CDI" className="focus:bg-white focus:text-slate-900">CDI</SelectItem>
                <SelectItem value="CDD" className="focus:bg-white focus:text-slate-900">CDD</SelectItem>
                <SelectItem value="Interim" className="focus:bg-white focus:text-slate-900">Intérim</SelectItem>
                <SelectItem value="Apprentissage" className="focus:bg-white focus:text-slate-900">Apprentissage</SelectItem>
                <SelectItem value="Sous-traitant" className="focus:bg-white focus:text-slate-900">Sous-traitant</SelectItem>
             </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hireDate" className="text-[13px] font-medium text-slate-600">Date d'embauche <span className="text-red-500">*</span></Label>
          <Input id="hireDate" name="hireDate" type="date" required className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 [color-scheme:dark]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2.5 bg-blue-900/10 p-5 border border-blue-900/30 rounded-xl">
          <Label htmlFor="monthlyCost" className="text-[13px] font-medium text-blue-400">Coût global / mois complet (€) <span className="text-red-500">*</span></Label>
          <p className="text-[11px] text-slate-500">Sert au calcul du coût journalier (Lun-Sam hors jours fériés).</p>
          <Input id="monthlyCost" name="monthlyCost" type="number" step="0.01" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} required className="w-full bg-[#f8f9fc] border-slate-200 text-slate-900 focus-visible:ring-blue-600" placeholder="ex: 3500.00" />
        </div>

        <div className="space-y-2.5 bg-zinc-50 p-5 border border-slate-200 rounded-xl">
          <Label htmlFor="dailyCost" className="text-[13px] font-medium text-slate-600">Coût journalier déduit (Moy: {avgDaysPerMonth.toFixed(1)} jrs/mois)</Label>
          <p className="text-[11px] text-slate-500">Valeur appliquée à la rentabilité globale par tournée.</p>
          <Input id="dailyCost" name="dailyCost" type="number" step="0.01" readOnly value={calculatedDailyCost} className="w-full bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-semibold" />
        </div>
      </div>

      <div className="space-y-2.5 bg-emerald-900/5 p-5 border border-emerald-900/20 rounded-xl">
        <Label htmlFor="monthlyNetSalary" className="text-[13px] font-medium text-emerald-600">Salaire Net / Fixe Contractuel (€) <span className="text-slate-400 font-normal lowercase">(Optionnel)</span></Label>
        <p className="text-[11px] text-slate-500">Si renseigné, remplace l'estimation automatique (~75% du brut) dans le tableau de bord paie.</p>
        <Input id="monthlyNetSalary" name="monthlyNetSalary" type="number" step="0.01" className="w-full bg-white border-slate-200 text-slate-900 focus-visible:ring-emerald-600" placeholder="ex: 2000.00" />
      </div>

      <div className="space-y-4 p-5 border border-slate-200 bg-slate-50 rounded-xl">
         <h4 className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
            Initialisation des compteurs (Reprise d'historique)
         </h4>
         <p className="text-[11px] text-slate-500">Pour un salarié existant, renseignez ses soldes actuels. Laissez à 0 pour un nouveau salarié.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label htmlFor="paidLeaveBalance" className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Congés Payés (Solde)</Label>
               <Input id="paidLeaveBalance" name="paidLeaveBalance" type="number" step="0.5" defaultValue="0" className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="paidLeaveReferenceDate" className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Date de Réf. du Solde</Label>
               <Input id="paidLeaveReferenceDate" name="paidLeaveReferenceDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="justifiedAbsences" className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Absences Justifiées</Label>
               <Input id="justifiedAbsences" name="justifiedAbsences" type="number" step="0.5" defaultValue="0" className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="unjustifiedAbsences" className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Absences Injustifiées</Label>
               <Input id="unjustifiedAbsences" name="unjustifiedAbsences" type="number" step="0.5" defaultValue="0" className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
            </div>
         </div>
      </div>

      {jobTitle === "Chauffeur" && (
        <div className="space-y-4 p-5 mt-4 border border-slate-200 bg-white rounded-xl">
           <h4 className="text-[13px] font-semibold text-slate-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500"/> Identifiants Application Chauffeur
           </h4>
           <p className="text-[11px] text-slate-500">Définissez manuellement les accès de ce chauffeur ou laissez vide pour une génération automatique.</p>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label htmlFor="driverEmail" className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Identifiant</Label>
                 <Input id="driverEmail" name="driverEmail" type="text" placeholder="ex: prenom123" className="bg-[#f8f9fc] border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="driverPassword" className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Mot de passe</Label>
                 <Input id="driverPassword" name="driverPassword" type="text" placeholder="ex: MotDePasse123!" className="bg-[#f8f9fc] border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
              </div>
           </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[13px] mt-4 font-medium">
          {error}
        </div>
      )}

      <div className="pt-2">
        <Button disabled={isPending} type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-slate-900 font-medium shadow-sm shadow-blue-900/20">
          {isPending ? "Création en cours..." : "Enregistrer le salarié"}
        </Button>
      </div>
    </form>
  );
}
