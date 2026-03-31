"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function UserButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-zinc-400 hover:text-red-600 transition-colors p-2 bg-zinc-50 hover:bg-red-50 rounded-full border border-zinc-100"
      aria-label="Se déconnecter"
    >
      <LogOut className="w-[18px] h-[18px]" />
    </button>
  );
}
