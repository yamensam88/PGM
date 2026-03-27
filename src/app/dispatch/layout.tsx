export const dynamic = 'force-dynamic';

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DispatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "dispatcher";
  const orgId = session?.user?.organization_id;

  let isSuperAdmin = false;
  if (userRole === "owner" && orgId) {
    const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' } });
    if (masterOrg?.id === orgId) {
      isSuperAdmin = true;
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-[#f8f9fc]">
      <Sidebar userRole={userRole} isSuperAdmin={isSuperAdmin} />
      <div className="flex flex-col flex-1 w-full md:pl-64 transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
