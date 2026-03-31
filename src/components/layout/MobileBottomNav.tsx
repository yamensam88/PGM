"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Accueil", href: "/driver", icon: Home },
    { name: "Colis", href: "/driver/deliveries", icon: Package },
    { name: "Sinistres", href: "/driver/incidents", icon: AlertTriangle },
    { name: "Moi", href: "/driver/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-zinc-200 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] pb-5 pt-2 px-2 select-none md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/driver');
          // Exactly matching /driver for home
          const isExact = item.href === '/driver' ? pathname === '/driver' : isActive;

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center p-1.5 min-w-[70px] transition-all duration-300",
                isExact ? "text-orange-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {isExact && (
                <div className="absolute -top-3 w-10 h-1 bg-orange-600 rounded-b-full shadow-[0_0_10px_rgba(234,88,12,0.5)]"></div>
              )}
              <item.icon className={cn(
                "w-[22px] h-[22px] mb-1.5 transition-all duration-300", 
                isExact ? "scale-110 drop-shadow-sm" : ""
              )} />
              <span className={cn(
                "text-[10px] tracking-wide transition-all duration-300", 
                isExact ? "font-bold text-orange-600" : "font-medium"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
