"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  LayoutDashboard,
  Route,
  Truck,
  Users,
  ShieldAlert,
  BarChart3,
  Settings,
  Briefcase,
  CreditCard,
  Menu,
  Map
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/dispatch/dashboard", icon: LayoutDashboard },
  { name: "Planification", href: "/dispatch/planning", icon: BarChart3 },
  { name: "Carte", href: "/dispatch/map", icon: Map },
  { name: "Suivi Tournées", href: "/dispatch/runs", icon: Route },
  { name: "CRM Clients", href: "/dispatch/crm", icon: Users },
  { name: "Flotte & RH", href: "/dispatch/hr", icon: Users },
  { name: "Paramètres", href: "/dispatch/settings", icon: Settings },
  { name: "Abonnement", href: "/dispatch/settings/billing", icon: CreditCard },
  { name: "Super Admin", href: "/super-admin", icon: ShieldAlert },
  { name: "Interface Chauffeur", href: "/driver", icon: Truck },
];

const allowedPaths: Record<string, string[]> = {
  admin: ['/dispatch/dashboard', '/dispatch/runs', '/dispatch/hr', '/dispatch/settings', '/dispatch/settings/billing', '/driver'],
  owner: ['/dispatch/dashboard', '/dispatch/runs', '/dispatch/hr', '/dispatch/settings', '/dispatch/settings/billing', '/super-admin', '/driver'],
  dispatcher: ['/dispatch/runs', '/driver'],
  manager: ['/dispatch/runs', '/driver'],
  hr: ['/dispatch/hr'],
  finance: ['/dispatch/dashboard'],
};

export function Sidebar({ userRole = 'dispatcher', isSuperAdmin = false }: { userRole?: string, isSuperAdmin?: boolean }) {
  return (
    <Suspense fallback={<div className="w-64 bg-white border-r border-slate-100/60 h-screen fixed hidden md:block"></div>}>
      <div className="flex flex-col w-64 bg-white border-r border-slate-100/60 text-slate-600 h-screen fixed top-0 left-0 hidden md:flex z-50 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        <SidebarContent userRole={userRole} isSuperAdmin={isSuperAdmin} />
      </div>
    </Suspense>
  );
}

export function MobileSidebar({ userRole = 'dispatcher', isSuperAdmin = false }: { userRole?: string, isSuperAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* @ts-ignore */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-slate-500 hover:text-orange-500 mr-2">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-white border-r-0">
        <Suspense fallback={<div className="w-full h-full bg-white"></div>}>
           <div className="flex flex-col w-full bg-white text-slate-600 h-full">
             <SidebarContent userRole={userRole} isSuperAdmin={isSuperAdmin} onNavItemClick={() => setOpen(false)} />
           </div>
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

function SidebarContent({ userRole, isSuperAdmin, onNavItemClick }: { userRole: string, isSuperAdmin: boolean, onNavItemClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filter = searchParams.get("filter");
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  let queryString = "";
  if (urlFrom && urlTo) {
    queryString = `?from=${urlFrom}&to=${urlTo}`;
  } else if (filter) {
    queryString = `?filter=${filter}`;
  }

  return (
    <>
      {/* Brand */}
      <div className="flex h-[72px] items-center px-6 border-b border-slate-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-slate-200 p-0.5">
            <img src="/logo.png" alt="PGM Icon" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center truncate">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">PGM</span>
            <span className="text-[10px] font-bold tracking-widest text-[#ea580c] mt-1 truncate uppercase">Pilotage • Gestion • Maîtrise</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 block">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isAllowed = allowedPaths[userRole]?.includes(item.href) || false;
          const Icon = item.icon;

          if (item.name === "Super Admin" && !isSuperAdmin) {
             return null;
          }

          if (!isAllowed) {
             return (
               <span key={item.name} className="flex items-center px-4 py-3 text-[13px] font-medium rounded-xl text-zinc-600 opacity-50 cursor-not-allowed">
                 <Icon className="flex-shrink-0 w-4 h-4 mr-3 text-zinc-600" />
                 {item.name}
               </span>
             );
          }

          const targetHref = item.href.startsWith("/dispatch") ? `${item.href}${queryString}` : item.href;
          const safeId = `tour-nav-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

          return (
            <Link key={item.name} href={targetHref} id={safeId} className="block group" onClick={onNavItemClick}>
              <span
                className={`flex items-center px-4 py-3 text-[13px] font-semibold rounded-xl transition-all relative ${
                  isActive
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`flex-shrink-0 w-4 h-4 mr-3 transition-colors ${
                    isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
