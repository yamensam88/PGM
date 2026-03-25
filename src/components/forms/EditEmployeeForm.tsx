"use client";

import { useTransition, useState } from "react";
import { updateEmployee } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function EditEmployeeForm({ employee, onSuccess }: { employee: any, onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("driverId", employee.id);

    startTransition(async () => {
      try {
        const result = await updateEmployee(formData);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de la mise à jour.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  const formattedHireDate = employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '';
  const initialJobTitle = employee.job_title || "Chauffeur";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-[13px] font-medium text-slate-600">Prénom *</Label>
          <Input id="firstName" name="firstName" defaultValue={employee.first_name} required className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-[13px] font-medium text-slate-600">Nom *</Label>
          <Input id="lastName" name="lastName" defaultValue={employee.last_name} required className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <Label htmlFor="email" className="text-[13px] font-medium text-slate-600">Email / Identifiant</Label>
           <Input id="email" name="email" type="text" defaultValue={employee.email || ''} className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
        </div>
        <div className="space-y-2">
           <Label htmlFor="phone" className="text-[13px] font-medium text-slate-600">Téléphone</Label>
           <Input id="phone" name="phone" type="tel" defaultValue={employee.phone || ''} className="bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-[13px] font-medium text-slate-600">Poste *</Label>
          <Select name="jobTitle" defaultValue={initialJobTitle} required>
             <SelectTrigger className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600">
                <SelectValue placeholder="Sélectionner le poste" />
             </SelectTrigger>
             <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="Chauffeur">Chauffeur (Accès App Driver)</SelectItem>
                <SelectItem value="Exploitant">Exploitant</SelectItem>
                <SelectItem value="Gestionnaire de flotte">Gestionnaire de flotte</SelectItem>
                <SelectItem value="Chef de quai">Chef de quai</SelectItem>
                <SelectItem value="Ressources Humaines">Ressources Humaines</SelectItem>
                <SelectItem value="Assistant Administratif">Assistant Administratif</SelectItem>
             </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentType" className="text-[13px] font-medium text-slate-600">Nature du contrat *</Label>
          <Select name="employmentType" defaultValue={employee.employment_type || "CDI"} required>
             <SelectTrigger className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600">
                <SelectValue placeholder="Type" />
             </SelectTrigger>
             <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="CDI">CDI</SelectItem>
                <SelectItem value="CDD">CDD</SelectItem>
                <SelectItem value="Interim">Intérim</SelectItem>
                <SelectItem value="Apprentissage">Apprentissage</SelectItem>
                <SelectItem value="Sous-traitant">Sous-traitant</SelectItem>
             </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
         <Label htmlFor="hireDate" className="text-[13px] font-medium text-slate-600">Date d'entrée *</Label>
         <Input id="hireDate" name="hireDate" type="date" defaultValue={formattedHireDate} required className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
      </div>

      <div className="space-y-4 p-5 mt-4 border border-slate-200 bg-emerald-50/50 rounded-xl">
         <h4 className="text-[13px] font-semibold text-slate-700">Mise à jour des compteurs</h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
               <Label htmlFor="paidLeaveBalance" className="text-[11px] font-medium text-slate-500 uppercase">Congés Payés</Label>
               <Input id="paidLeaveBalance" name="paidLeaveBalance" type="number" step="0.5" defaultValue={employee.paid_leave_balance || "0"} className="bg-white border-slate-200 text-slate-700" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="justifiedAbsences" className="text-[11px] font-medium text-slate-500 uppercase">Abs. Justifiées</Label>
               <Input id="justifiedAbsences" name="justifiedAbsences" type="number" step="0.5" defaultValue={employee.justified_absences || "0"} className="bg-white border-slate-200 text-slate-700" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="unjustifiedAbsences" className="text-[11px] font-medium text-slate-500 uppercase">Abs. Injustifiées</Label>
               <Input id="unjustifiedAbsences" name="unjustifiedAbsences" type="number" step="0.5" defaultValue={employee.unjustified_absences || "0"} className="bg-white border-slate-200 text-slate-700" />
            </div>
         </div>
      </div>

      {error && <div className="text-red-500 text-[13px] font-medium bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}

      <div className="pt-2">
        <Button disabled={isPending} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
          {isPending ? "Mise à jour en cours..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
