import { IncidentForm } from "@/components/forms/IncidentForm";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const { runId } = await params;

  const run = await prisma.dailyRun.findFirst({
    where: { 
        id: runId,
        organization_id: session.user.organization_id 
    },
    select: { id: true }
  });

  if (!run) return notFound();

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-zinc-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        <Link href={`/driver/runs/${run.id}/finish`} className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour
        </Link>
        
        <div className="bg-white rounded-2xl border border-red-900/50 p-6 shadow-2xl">
          <IncidentForm runId={run.id} />
        </div>

      </div>
    </div>
  );
}
