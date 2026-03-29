"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateClientForm } from "@/components/forms/CreateClientForm";
import { CreateRateCardForm, DeleteRateCardForm, EditRateCardForm } from "@/components/forms/RateCardForms";

export function ClientRateCardsManager({ clients }: { clients: any[] }) {
  return (
    <Card className="border-zinc-200 shadow-sm dark:border-slate-200 dark:bg-white/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-zinc-900 dark:text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Gestion des Clients & Grilles
            </CardTitle>
            <CardDescription>Gérez vos donneurs d'ordre et leurs tarifications spécifiques.</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
              <Plus className="w-4 h-4" /> Nouveau Client
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Client</DialogTitle>
                <DialogDescription>Créez un nouveau profil client/donneur d'ordre.</DialogDescription>
              </DialogHeader>
              <CreateClientForm />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {clients.length === 0 ? (
          <div className="text-center py-6 text-slate-500">Aucun client configuré.</div>
        ) : (
          <div className="space-y-4">
            {clients.map(client => (
              <div key={client.id} className="border border-zinc-200 dark:border-slate-300 rounded-lg overflow-hidden bg-zinc-50 dark:bg-slate-50">
                <div className="bg-white dark:bg-white px-4 py-3 flex justify-between items-center border-b border-zinc-200 dark:border-slate-200">
                  <div>
                    <h3 className="font-bold text-zinc-900">{client.name}</h3>
                    {client.client_code && <span className="text-xs text-slate-500">{client.client_code}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{client.rate_cards?.length || 0} grilles</span>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col gap-3">
                  {(!client.rate_cards || client.rate_cards.length === 0) ? (
                    <p className="text-xs text-slate-400">Aucune grille tarifaire pour ce client.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {client.rate_cards.map((rc: any) => (
                        <div key={rc.id} className="bg-white border border-indigo-100 rounded-md p-3 relative shadow-sm">
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                             <Dialog>
                               <DialogTrigger className="text-slate-400 hover:text-indigo-600 transition-colors">
                                 <Edit className="w-3.5 h-3.5" />
                               </DialogTrigger>
                               <DialogContent>
                                 <DialogHeader>
                                   <DialogTitle>Modifier la Grille Tarifaire</DialogTitle>
                                   <DialogDescription>Ajustez les tarifs de la grille "{rc.name}".</DialogDescription>
                                 </DialogHeader>
                                 <EditRateCardForm rateCard={rc} />
                               </DialogContent>
                             </Dialog>
                          </div>
                          <h4 className="font-semibold text-sm text-indigo-900 mb-2 truncate pr-16">{rc.name}</h4>
                          <div className="space-y-1 text-xs text-slate-600">
                            <div className="flex justify-between">
                              <span>Forfait Jour:</span>
                              <span className="font-medium text-slate-900">{Number(rc.base_daily_flat || 0).toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Prix colis:</span>
                              <span className="font-medium text-slate-900">{Number(rc.unit_price_package || 0).toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Collecte:</span>
                              <span className="font-medium text-slate-900">{Number(rc.unit_price_stop || 0).toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Colis relais:</span>
                              <span className="font-medium text-slate-900">{Number(rc.bonus_relay_point || 0).toFixed(2)}€</span>
                            </div>
                          </div>
                          <DeleteRateCardForm rateCardId={rc.id} />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Plus Grille Action inside client block */}
                  <div className="pt-2 text-right">
                    <Dialog>
                      <DialogTrigger className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 text-xs font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <Plus className="w-3 h-3 mr-1" /> Ajouter une Grille pour {client.name}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nouvelle Grille Tarifaire</DialogTitle>
                          <DialogDescription>Paramétrez une facturation spécifique à ce client.</DialogDescription>
                        </DialogHeader>
                        <CreateRateCardForm clientId={client.id} clientName={client.name} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
