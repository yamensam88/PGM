import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Création des comptes de test manquants...');

  // 1. Get the organization
  const org = await prisma.organization.findFirst({
    where: { name: 'DeliverTech Paris' }
  });

  if (!org) {
    console.error("Organisation introuvable. Veuillez d'abord exécuter le seed principal.");
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create HR User
  await prisma.user.upsert({
    where: { email: 'rh@delivertech.fr' },
    update: {},
    create: {
      organization_id: org.id,
      email: 'rh@delivertech.fr',
      password_hash: passwordHash,
      role: 'hr',
      first_name: 'Julie',
      last_name: 'Ressources'
    }
  });
  console.log('✅ Compte RH créé : rh@delivertech.fr / password123');

  // 3. Create Finance User
  await prisma.user.upsert({
    where: { email: 'finance@delivertech.fr' },
    update: {},
    create: {
      organization_id: org.id,
      email: 'finance@delivertech.fr',
      password_hash: passwordHash,
      role: 'finance',
      first_name: 'Marc',
      last_name: 'Compta'
    }
  });
  console.log('✅ Compte Finance créé : finance@delivertech.fr / password123');

  // 4. Create Driver User (App Chauffeur)
  // First ensure there is at least one driver in the DB
  let driver = await prisma.driver.findFirst({
    where: { organization_id: org.id }
  });

  if (!driver) {
     driver = await prisma.driver.create({
       data: {
          organization_id: org.id,
          first_name: 'Paul',
          last_name: 'Le Chauffeur',
          employee_code: 'DRV-TEST',
          daily_base_cost: 130
       }
     });
  }

  await prisma.user.upsert({
    where: { email: 'chauffeur@delivertech.fr' },
    update: {},
    create: {
      organization_id: org.id,
      email: 'chauffeur@delivertech.fr',
      password_hash: passwordHash,
      role: 'driver',
      first_name: driver.first_name,
      last_name: driver.last_name
    }
  });
  console.log('✅ Compte Chauffeur créé : chauffeur@delivertech.fr / password123');

  console.log('Terminé !');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
