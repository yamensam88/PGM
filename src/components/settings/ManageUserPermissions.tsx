"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings2, Loader2, LayoutDashboard, Route, Users } from "lucide-react";
import { updateUserPermissions } from "@/lib/actions";

type PermissionItem = {
  id: string; // The href path
  label: string;
  icon: React.ElementType;
};

const permissionModules: PermissionItem[] = [
  { id: "/dispatch/dashboard", label: "Direction (Dashboard)", icon: LayoutDashboard },
  { id: "/dispatch/runs", label: "Exploitation & Flotte", icon: Route },
  { id: "/dispatch/hr", label: "Ressources Humaines", icon: Users },
  { id: "/dispatch/settings", label: "Paramètres Globaux", icon: Settings2 }
];

export function ManageUserPermissions({ userId, userName, initialPermissions }: { userId: string, userName: string, initialPermissions: any }) {
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(initialPermissions || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (id: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateUserPermissions(userId, permissions);
      if (res.success) {
        alert("Permissions Mises à jour ! La modification sera appliquée à sa prochaine connexion.");
        setOpen(false);
      } else {
        alert(`Erreur: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Erreur critique: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error asChild is currently invalid for DialogTrigger in this version */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 relative" title="Gérer les accès">
            <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accès & Permissions</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Gérez individuellement les interfaces accessibles pour <strong>{userName}</strong>. Ce réglage surcharge les permissions par défaut liées à son rôle.</p>
        </DialogHeader>

        <div className="py-6 space-y-5">
           {permissionModules.map(mod => (
              <div key={mod.id} className="flex flex-row items-center justify-between rounded-lg border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="space-y-0.5">
                  <Label htmlFor={mod.id} className="flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                     <mod.icon className="w-4 h-4 text-slate-500" />
                     {mod.label}
                  </Label>
                  <p className="text-[11px] text-slate-500 font-medium">Autoriser l'accès au module {mod.label}</p>
                </div>
                <input 
                  type="checkbox"
                  id={mod.id} 
                  checked={permissions[mod.id] || false}
                  onChange={(e) => handleToggle(mod.id, e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>
           ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
           <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
           <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 font-semibold gap-2 w-32">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sauvegarder"}
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
