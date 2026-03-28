"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  LayoutDashboard,
  Route,
  Truck,
  Users,
  ShieldAlert,
  BarChart3,
  Settings,
  Briefcase,
  CreditCard
} from "lucide-react";

const navItems = [
  { name: "Direction", href: "/dispatch/dashboard", icon: LayoutDashboard },
  { name: "Exploitation & Flotte", href: "/dispatch/runs", icon: Route },
  { name: "RH", href: "/dispatch/hr", icon: Users },
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
      <SidebarContent userRole={userRole} isSuperAdmin={isSuperAdmin} />
    </Suspense>
  );
}

function SidebarContent({ userRole, isSuperAdmin }: { userRole: string, isSuperAdmin: boolean }) {
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
    <div className="flex flex-col w-64 bg-white border-r border-slate-100/60 text-slate-600 h-screen fixed top-0 left-0 hidden md:flex z-50 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
      {/* Brand */}
      <div className="flex h-[72px] items-center px-6 border-b border-slate-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm flex items-center justify-center">
             <Route className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">PGM</span>
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
               <span key={item.name} className="flex items-center px-3 py-2 text-[13px] font-medium rounded-md text-zinc-600 opacity-50 cursor-not-allowed">
                 <Icon className="flex-shrink-0 w-4 h-4 mr-3 text-zinc-600" />
                 {item.name}
               </span>
             );
          }

          const targetHref = item.href.startsWith("/dispatch") ? `${item.href}${queryString}` : item.href;
          const safeId = `tour-nav-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

          return (
            <Link key={item.name} href={targetHref} id={safeId} className="block group">
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
    </div>
  );
}
