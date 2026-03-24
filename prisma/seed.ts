import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seeding massif (PGM v2)...')

  // Clean existing data to avoid conflicts on reset
  await prisma.financialEntry.deleteMany()
  await prisma.hrEvent.deleteMany()
  await prisma.maintenanceLog.deleteMany()
  await prisma.fuelLog.deleteMany()
  await prisma.eventsLog.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.dailyRun.deleteMany()
  await prisma.rateCard.deleteMany()
  await prisma.client.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'PGM Europe',
      tax_id: 'FR123456789',
      currency: 'EUR',
      country: 'FR',
      subscription_plan: 'premium',
      subscription_status: 'active',
      settings_json: { timezone: 'Europe/Paris', language: 'fr' }
    },
  })
  console.log(`✅ Organisation créée : ${org.id}`)

  // 1b. Users
  const passwordHash = await bcrypt.hash('password123', 10)
  
  await prisma.user.create({
    data: {
      organization_id: org.id,
      email: 'admin@pgm.eu',
      password_hash: passwordHash,
      role: 'admin',
      first_name: 'Sarah',
      last_name: 'Connor',
      phone: '+33612345678'
    }
  })
  
  await prisma.user.create({
    data: {
      organization_id: org.id,
      email: 'dispatch@pgm.eu',
      password_hash: passwordHash,
      role: 'dispatcher',
      first_name: 'Tom',
      last_name: 'Cruise'
    }
  })

  // 2. Drivers (Multiple profiles)
  const driver1 = await prisma.driver.create({
    data: {
      organization_id: org.id,
      first_name: 'Jean',
      last_name: 'Dupont',
      employee_code: 'DRV-001',
      daily_base_cost: 150.00,
      quality_rating: 4.8,
      performance_score: 95.5,
      compliance_status: 'valid',
      hire_date: new Date('2023-01-15')
    },
  })

  const driver2 = await prisma.driver.create({
    data: {
      organization_id: org.id,
      first_name: 'Alice',
      last_name: 'Martin',
      employee_code: 'DRV-002',
      daily_base_cost: 160.00,
      quality_rating: 4.9,
      performance_score: 98.0,
      compliance_status: 'valid',
    },
  })
  
  const driver3 = await prisma.driver.create({
    data: {
      organization_id: org.id,
      first_name: 'Bob',
      last_name: 'Lennon',
      employee_code: 'DRV-003',
      daily_base_cost: 140.00,
      quality_rating: 3.5,
      performance_score: 80.0,
      compliance_status: 'warning',
    },
  })
  console.log(`✅ 3 Chauffeurs créés`)

  // 3. Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      organization_id: org.id,
      plate_number: 'AB-123-CD',
      internal_code: 'V-001',
      brand: 'Renault',
      model: 'Master',
      category: 'van',
      fuel_type: 'diesel',
      current_km: 45000,
      internal_cost_per_km: 0.15,
      fixed_monthly_cost: 500,
      status: 'active'
    },
  })

  const vehicle2 = await prisma.vehicle.create({
    data: {
      organization_id: org.id,
      plate_number: 'EF-456-GH',
      internal_code: 'V-002',
      brand: 'Peugeot',
      model: 'Boxer',
      category: 'van',
      fuel_type: 'diesel',
      current_km: 120000,
      internal_cost_per_km: 0.18,
      fixed_monthly_cost: 450,
      status: 'active'
    },
  })
  
  const vehicle3 = await prisma.vehicle.create({
    data: {
      organization_id: org.id,
      plate_number: 'IJ-789-KL',
      internal_code: 'V-003',
      brand: 'Mercedes',
      model: 'eSprinter',
      category: 'van',
      fuel_type: 'electric',
      current_km: 15000,
      internal_cost_per_km: 0.10,
      fixed_monthly_cost: 800,
      status: 'maintenance'
    },
  })
  console.log(`✅ 3 Véhicules créés`)

  // 4. Clients
  const client1 = await prisma.client.create({
    data: {
      organization_id: org.id,
      name: 'Amazon Prime',
      client_code: 'AMZN',
      payment_terms_days: 30
    },
  })

  const client2 = await prisma.client.create({
    data: {
      organization_id: org.id,
      name: 'Chronopost',
      client_code: 'CHRO',
      payment_terms_days: 45
    },
  })
  console.log(`✅ 2 Clients créés`)

  // 5. Zones
  const zoneNord = await prisma.zone.create({
    data: {
      organization_id: org.id,
      name: 'Paris Nord',
      difficulty_multiplier: 1.2,
      zone_type: 'urban'
    },
  })

  const zoneBanlieue = await prisma.zone.create({
    data: {
      organization_id: org.id,
      name: 'Banlieue Ouest',
      difficulty_multiplier: 1.0,
      zone_type: 'suburban'
    },
  })

  // 6. Rate Cards
  const rateCard1 = await prisma.rateCard.create({
    data: {
      organization_id: org.id,
      client_id: client1.id,
      name: 'Amazon Standard Van',
      pricing_mode: 'mixed',
      unit_price_stop: 1.20,
      unit_price_package: 0.50,
      bonus_relay_point: 0.80,
      base_daily_flat: 50.00
    },
  })
  
  const rateCard2 = await prisma.rateCard.create({
    data: {
      organization_id: org.id,
      client_id: client2.id,
      name: 'Chrono Flat Daily',
      pricing_mode: 'flat_daily',
      base_daily_flat: 280.00
    },
  })

  // 7. Daily Runs (Historical and Today)
  const today = new Date()
  today.setHours(8, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Run 1: Completed yesterday (Good performance)
  const run1 = await prisma.dailyRun.create({
    data: {
      organization_id: org.id,
      client_id: client1.id,
      rate_card_id: rateCard1.id,
      driver_id: driver1.id,
      vehicle_id: vehicle1.id,
      zone_id: zoneNord.id,
      date: yesterday,
      status: 'completed',
      departure_time: new Date(yesterday.getTime() + 30 * 60000), // 8:30
      return_time: new Date(yesterday.getTime() + 9 * 3600000), // 17:30
      run_duration_minutes: 540,
      km_start: 44900,
      km_end: 45000,
      km_total: 100,
      fuel_consumed_liters: 12.5,
      stops_planned: 80,
      stops_completed: 79,
      stops_failed: 1,
      packages_loaded: 120,
      packages_delivered: 115,
      packages_relay: 4,
      packages_returned: 1,
      revenue_calculated: 202.20, // (50 flat) + (79*1.2) + (115*0.5) + (4*0.8) = 50 + 94.8 + 57.5 + 3.2 = 205.5
      cost_driver: 150.00,
      cost_vehicle: 100 * 0.15, // 15
      cost_fuel: 12.5 * 1.8, // 22.5
      total_cost: 187.50,
      margin_net: 14.70,
      productivity_index: 98,
      sst_score: 100
    },
  })

  // Run 2: Completed yesterday (Bad performance / Chrono)
  const run2 = await prisma.dailyRun.create({
    data: {
      organization_id: org.id,
      client_id: client2.id,
      rate_card_id: rateCard2.id,
      driver_id: driver3.id,
      vehicle_id: vehicle2.id,
      zone_id: zoneBanlieue.id,
      date: yesterday,
      status: 'completed',
      departure_time: new Date(yesterday.getTime() + 60 * 60000), // 9:00
      return_time: new Date(yesterday.getTime() + 10 * 3600000), // 19:00
      run_duration_minutes: 600,
      km_start: 119800,
      km_end: 120000,
      km_total: 200,
      fuel_consumed_liters: 25.0,
      stops_planned: 50,
      stops_completed: 40,
      stops_failed: 10,
      packages_loaded: 55,
      packages_delivered: 45,
      packages_returned: 10,
      revenue_calculated: 280.00,
      cost_driver: 140.00,
      cost_vehicle: 200 * 0.18, // 36
      cost_fuel: 25 * 1.8, // 45
      total_cost: 221.00,
      margin_net: 59.00,
      productivity_index: 80,
      penalty_risk_score: 80 // High risk because of failed stops
    },
  })

  // Run 3: In progress today
  const run3 = await prisma.dailyRun.create({
    data: {
      organization_id: org.id,
      client_id: client1.id,
      rate_card_id: rateCard1.id,
      driver_id: driver2.id,
      vehicle_id: vehicle1.id, // Using same vehicle as run 1
      zone_id: zoneNord.id,
      date: today,
      status: 'in_progress',
      km_start: 45000,
      stops_planned: 100,
      packages_loaded: 150,
      departure_time: new Date(today.getTime() + 15 * 60000), // 8:15
    },
  })
  console.log(`✅ 3 Tournées créées (DailyRuns)`)

  // 8. Incidents
  await prisma.incident.create({
    data: {
      organization_id: org.id,
      run_id: run2.id,
      driver_id: driver3.id,
      vehicle_id: vehicle2.id,
      incident_type: 'absent_customer',
      severity: 'low',
      description: 'Client absent, impossible de livrer.',
      photo_evidence_url: 'https://placehold.co/600x400',
      ai_validation_flag: true,
      penalty_saved_amount: 15.00
    }
  })

  await prisma.incident.create({
    data: {
      organization_id: org.id,
      run_id: run2.id,
      driver_id: driver3.id,
      vehicle_id: vehicle2.id,
      incident_type: 'damaged_package',
      severity: 'high',
      description: 'Colis endommagé pendant le chargement.',
      penalty_exposure_amount: 50.00,
      resolution_status: 'contested'
    }
  })

  // 9. Fuel Logs & Maintenance
  await prisma.fuelLog.create({
    data: {
      organization_id: org.id,
      vehicle_id: vehicle2.id,
      run_id: run2.id,
      liters: 25.0,
      price_per_liter: 1.80,
      total_cost: 45.0,
      fueled_at: new Date(yesterday.getTime() + 5 * 3600000), // 13:00 yesterday
      station_name: 'Total Paris Nord'
    }
  })

  await prisma.maintenanceLog.create({
    data: {
      organization_id: org.id,
      vehicle_id: vehicle3.id,
      maintenance_type: 'repair',
      description: 'Changement batterie',
      cost: 450.00,
      km_at_service: 15000,
      service_date: yesterday,
      vendor_name: 'Garage Central'
    }
  })

  // 10. HR Events
  await prisma.hrEvent.create({
    data: {
      organization_id: org.id,
      driver_id: driver3.id,
      event_type: 'warning',
      start_date: today,
      status: 'active',
      notes: 'Avertissement pour retards répétés.'
    }
  })

  // 11. Financial Entries
  await prisma.financialEntry.create({
    data: {
      organization_id: org.id,
      run_id: run1.id,
      client_id: client1.id,
      entry_type: 'revenue',
      category: 'delivery_revenue',
      amount: 205.50,
      entry_date: yesterday
    }
  })

  await prisma.financialEntry.create({
    data: {
      organization_id: org.id,
      run_id: run1.id,
      vehicle_id: vehicle1.id,
      entry_type: 'cost',
      category: 'fuel_cost',
      amount: 22.50,
      entry_date: yesterday
    }
  })

  console.log('🚀 Seeding massif accompli avec succès !')
  console.log(`📌 Org: PGM Europe (${org.id})`)
  console.log(`📌 Admin: admin@pgm.eu / password123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
