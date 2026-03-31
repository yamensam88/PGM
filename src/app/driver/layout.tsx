import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { UserButton } from "@/components/auth/UserButton";
import { Bell } from "lucide-react";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#f8f9fc] overscroll-none">
      {/* Mobile Top Header (App-like) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm md:hidden">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
             <span className="text-white font-extrabold text-[15px] tracking-tighter">PGM</span>
           </div>
           <span className="font-bold text-zinc-900 tracking-tight text-lg">Driver</span>
        </div>
        <div className="flex items-center gap-3">
           <button className="text-zinc-400 hover:text-zinc-800 transition-colors p-2 relative bg-zinc-50 rounded-full border border-zinc-100">
             <Bell className="w-[18px] h-[18px]" />
             <span className="absolute top-1.5 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-zinc-50"></span>
           </button>
           <UserButton />
        </div>
      </header>

      {/* Desktop Helper Warning - Shown only on large screens since this is a mobile app */}
      <div className="hidden md:flex bg-orange-50 border-b border-orange-200 p-2 justify-center items-center text-orange-700 text-sm font-medium">
        L'interface Chauffeur est optimisée pour une utilisation sur téléphone mobile.
      </div>

      {/* Main App Content Area */}
      <div className="flex-1 w-full max-w-lg mx-auto pb-[90px] pt-4 px-4 overflow-y-auto w-full scroll-smooth">
        {children}
      </div>

      {/* iOS/Android Style Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
