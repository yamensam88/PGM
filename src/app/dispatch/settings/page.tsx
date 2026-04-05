import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Key, Users } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateUserForm } from "@/components/forms/CreateUserForm";
import { SettingsForms } from "@/components/settings/SettingsForms";
import { ClientRateCardsManager } from "@/components/settings/ClientRateCardsManager";
import { DeleteUserButton } from "@/components/settings/DeleteUserButton";
import { ChangeUserPasswordButton } from "@/components/settings/ChangeUserPasswordButton";
import { ManageUserPermissions } from "@/components/settings/ManageUserPermissions";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organization_id }
  });

  const clients = await prisma.client.findMany({
    where: { organization_id: session.user.organization_id },
    include: { rate_cards: true },
    orderBy: { name: 'asc' }
  });

  const users = await prisma.user.findMany({
    where: { 
      organization_id: session.user.organization_id,
      role: { in: ['admin', 'owner', 'manager', 'dispatcher', 'hr', 'finance'] }
    },
    orderBy: { created_at: 'asc' }
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50 max-w-5xl">
        <header className="border-b border-zinc-200 dark:border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Paramètres</h1>
          <p className="text-slate-500 mt-1">Gérez la configuration de votre organisation de transport.</p>
        </header>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full lg:w-[600px] grid-cols-4 mb-6 bg-zinc-100 dark:bg-white h-11">
            <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white">Général</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white">Utilisateurs</TabsTrigger>
            <TabsTrigger value="finances" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white text-blue-600 font-medium">Tarifs & Coûts</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white">Sécurité</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card className="border-zinc-200 shadow-sm dark:border-slate-200 dark:bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> Profil Organisation</CardTitle>
                <CardDescription>Informations légales et d'identification de votre entreprise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise</Label>
                    <Input id="companyName" defaultValue="PGM Europe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siret">Numéro de SIRET</Label>
                    <Input id="siret" defaultValue="80012345600010" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse du Siège</Label>
                  <Input id="address" defaultValue="14 Avenue de l'Opéra, 75001 Paris" />
                </div>
                <Button className="bg-blue-600 text-slate-900 hover:bg-blue-700 w-fit mt-4">Sauvegarder les modifications</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-zinc-200 shadow-sm dark:border-slate-200 dark:bg-white/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> Utilisateurs Back-office</CardTitle>
                        <CardDescription>Gérez les accès RH, Exploitation et Direction.</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger>
                        <Button className="bg-emerald-600 text-slate-900 hover:bg-emerald-700">+ Nouvel Utilisateur</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Créer un accès utilisateur</DialogTitle>
                          <DialogDescription>
                            Ajoutez un nouveau collaborateur. Ses identifiants sécurisés seront générés automatiquement.
                          </DialogDescription>
                        </DialogHeader>
                        <CreateUserForm />
                      </DialogContent>
                    </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                 {users.map(user => (
                   <div key={user.id} className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-slate-200 last:border-0">
                      <div>
                          <p className="font-medium text-sm text-zinc-800 dark:text-slate-700">
                             {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Utilisateur'}
                             {user.email === session.user?.email && " (Vous)"}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={
                          user.role === 'admin' || user.role === 'owner' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          user.role === 'hr' ? "bg-purple-100 text-purple-800 border-purple-200" :
                          "bg-blue-100 text-blue-800 border-blue-200"
                        }>
                          {user.role === 'admin' || user.role === 'owner' ? 'Direction' :
                           user.role === 'dispatcher' || user.role === 'manager' ? 'Exploitation' :
                           user.role === 'hr' ? 'RH' :
                           user.role === 'finance' ? 'Finance' : user.role}
                        </Badge>
                        <ManageUserPermissions 
                           userId={user.id} 
                           userName={user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Utilisateur'}
                           initialPermissions={(user as any).permissions}
                        />
                        <ChangeUserPasswordButton 
                           userId={user.id} 
                           userName={user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Utilisateur'} 
                        />
                        <DeleteUserButton userId={user.id} disabled={user.email === session.user?.email} />
                      </div>
                   </div>
                 ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances" className="space-y-4">
             <ClientRateCardsManager clients={JSON.parse(JSON.stringify(clients))} />
             <SettingsForms 
               initialSettings={organization?.settings_json} 
             />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="border-zinc-200 shadow-sm dark:border-slate-200 dark:bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-amber-500" /> Mot de passe</CardTitle>
                <CardDescription>Mettez à jour le mot de passe de votre compte administrateur.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 w-full md:max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPwd">Mot de passe actuel</Label>
                  <Input id="currentPwd" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPwd">Nouveau mot de passe</Label>
                  <Input id="newPwd" type="password" />
                </div>
                <Button className="bg-white text-slate-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 mt-2">Mettre à jour mot de passe</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
