"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileBadge, Trash2, Link as LinkIcon, UploadCloud, X, LayoutList } from "lucide-react";
import { uploadHrDocument, deleteHrDocument } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HrDocument {
  id: string;
  document_type: string;
  title: string;
  file_url: string;
  uploaded_at: Date;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  employee_code?: string | null;
  hr_documents?: HrDocument[];
}

export function HrDocumentManager({ driver }: { driver: Driver }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("paie");
  const [file, setFile] = useState<File | null>(null);

  const documents = driver.hr_documents || [];

  const handleUploadClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("driverId", driver.id);
      formData.append("documentType", docType);
      formData.append("title", title);
      formData.append("file", file);

      const res = await uploadHrDocument(formData);
      if (!res.success) {
         setError(res.error || "Une erreur est survenue.");
      } else {
         setShowForm(false);
         setFile(null);
         setTitle("");
      }
    } catch (err: any) {
      setError("Échec de l'upload local.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Voulez-vous supprimer ce document ?")) return;
    setLoading(true);
    try {
       await deleteHrDocument(docId);
    } catch {
       setError("Échec de la suppression.");
    } finally {
       setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5 border-zinc-300" />}>
        <FileText className="w-3.5 h-3.5"/> 
        Dossier RH ({documents.length})
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-zinc-50">
         <div className="bg-white px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-zinc-900">Dossier RH</h2>
               <p className="text-sm text-slate-500">{driver.first_name} {driver.last_name}</p>
            </div>
            {!showForm && (
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-slate-900 gap-2 h-9 text-sm">
                   <UploadCloud className="w-4 h-4" /> Ajouter
                </Button>
            )}
         </div>

         <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}

            {showForm ? (
               <div className="bg-white p-5 rounded-lg border border-blue-100 shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-blue-500"/>
                        Nouveau Document
                     </h3>
                     <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 w-8 p-0 text-slate-500">
                        <X className="w-4 h-4"/>
                     </Button>
                  </div>
                  <form onSubmit={handleUploadClick} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <Label className="text-xs">Type de document</Label>
                           <Select value={docType} onValueChange={(val) => setDocType(val || "paie")}>
                              <SelectTrigger className="h-10">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="contrat">Contrat de Travail</SelectItem>
                                 <SelectItem value="paie">Fiche de Paie</SelectItem>
                                 <SelectItem value="maladie">Arrêt Maladie</SelectItem>
                                 <SelectItem value="identite">Pièce d'identité</SelectItem>
                                 <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-xs">Nom du fichier</Label>
                           <Input 
                              placeholder="Ex: Paie Janvier 2026" 
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              required
                              className="h-10"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5 pt-2">
                        <Label className="text-xs">Fichier (.pdf, .png, .jpg)</Label>
                        <Input 
                           type="file" 
                           onChange={e => setFile(e.target.files?.[0] || null)}
                           required
                           className="text-slate-500 p-2 cursor-pointer h-10 bg-zinc-50 border-dashed border-2"
                        />
                     </div>
                     <Button type="submit" disabled={loading} className="w-full bg-white text-slate-900 hover:bg-white h-10 mt-2">
                        {loading ? "Enregistrement..." : "Ajouter le document"}
                     </Button>
                  </form>
               </div>
            ) : null}

            {!showForm && documents.length === 0 && (
               <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-200 rounded-lg bg-white">
                 <LayoutList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                 <p className="text-zinc-600 font-medium">Aucun document</p>
                 <p className="text-slate-500 text-sm mt-1">Le dossier RH de ce salarié est vide.</p>
               </div>
            )}

            {!showForm && documents.length > 0 && (
               <div className="space-y-3">
                  {documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()).map(doc => (
                     <div key={doc.id} className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-md ${
                              doc.document_type === 'paie' ? 'bg-emerald-50 text-emerald-600' :
                              doc.document_type === 'maladie' ? 'bg-red-50 text-red-600' :
                              'bg-blue-50 text-blue-600'
                           }`}>
                              {doc.document_type === 'paie' ? <FileText className="w-5 h-5"/> : <FileBadge className="w-5 h-5"/>}
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-zinc-900">{doc.title}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                 <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                                 <span>•</span>
                                 <span>{format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: fr })}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Button 
                             variant="outline" 
                             size="icon" 
                             className="h-8 w-8 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-none"
                             title="Ouvrir le document (Simulation)"
                           >
                              <LinkIcon className="w-4 h-4" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                             onClick={() => handleDelete(doc.id)}
                             disabled={loading}
                             title="Supprimer"
                           >
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </DialogContent>
    </Dialog>
  );
}
