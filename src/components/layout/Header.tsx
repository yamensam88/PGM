"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { ChatButton } from "@/components/chat/ChatButton";

export function Header({ mobileMenu }: { mobileMenu?: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // If we are in the driver interface but the user is an admin/owner
  const isDriverRoute = pathname?.startsWith("/driver");
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "owner";

  return (
    <header className="h-[72px] flex flex-shrink-0 items-center justify-between px-4 sm:px-8 bg-white/70 backdrop-blur-xl border-b border-slate-100/60 sticky top-0 z-10 w-full shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all">
      
      {/* Left side: Context Switcher etc */}
      <div className="flex-1 flex items-center gap-2 sm:gap-4">
        {mobileMenu}
        {isDriverRoute && isAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
            onClick={() => router.push("/dispatch/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour Back-Office</span>
          </Button>
        )}
        <div className="hidden md:flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
           <span className="px-3 py-1.5 bg-slate-50/50 rounded-full border border-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
             Org: {session?.user?.organization_id?.slice(0, 8) || "..."}
           </span>
        </div>
      </div>

      {/* Right side: Profile & Actions */}
      <div className="flex items-center gap-3">
        <ChatButton />

        <button className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
        </button>

        <div className="h-6 w-px bg-zinc-200 dark:bg-white mx-2" />

        <div className="flex items-center space-x-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-extrabold text-[#0A1A2F] leading-tight">
              {session?.user?.first_name || "Utilisateur"} {session?.user?.last_name || ""}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{session?.user?.role}</span>
          </div>
          
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white font-extrabold shadow-sm ring-2 ring-white">
            {session?.user?.first_name?.charAt(0) || <User className="w-4 h-4" />}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ml-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
