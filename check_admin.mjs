import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const master = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' } });
  console.log("--- MASTER ORG ---");
  console.log(master?.name, master?.id);

  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { email: { contains: 'sami88', mode: 'insensitive' } },
        { email: { contains: 'sami', mode: 'insensitive' } }
      ]
    }
  });
  console.log("--- FOUND USERS ---");
  users.forEach(u => console.log(u.email, u.role, u.organization_id));
}

main().finally(() => prisma.$disconnect());
