"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditEmployeeForm } from "@/components/forms/EditEmployeeForm";
import { Edit } from "lucide-react";
import { toast } from "sonner";

export function EditEmployeeDialog({ employee }: { employee: any }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors flex-shrink-0" title="Modifier le compte ou compteurs (email, tel, absences)"><Edit className="w-3.5 h-3.5" /></button>} />
      <DialogContent className="max-w-xl bg-white p-0 overflow-y-auto max-h-[85vh] border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
           <DialogTitle className="text-xl font-bold text-slate-900">Modifier le profil : {employee.first_name} {employee.last_name}</DialogTitle>
        </div>
        <div className="px-6 pb-6 pt-4 bg-[#f8f9fc]">
           <EditEmployeeForm employee={employee} onSuccess={() => { setOpen(false); toast.success("Données du salarié modifiées avec succès."); }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
