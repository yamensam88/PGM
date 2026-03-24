"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => router.back()}
      className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-2 gap-2 transition-all"
    >
      <ArrowLeft className="w-4 h-4" />
      Retour
    </Button>
  );
}
