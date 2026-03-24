-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tax_id" VARCHAR(100),
    "currency" VARCHAR(10) DEFAULT 'EUR',
    "country" VARCHAR(50) DEFAULT 'FR',
    "subscription_plan" VARCHAR(50) DEFAULT 'pro',
    "subscription_status" VARCHAR(50) DEFAULT 'active',
    "settings_json" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "phone" VARCHAR(50),
    "status" VARCHAR(50) DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "employee_code" VARCHAR(50),
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "employment_type" VARCHAR(50) DEFAULT 'employee',
    "hire_date" DATE,
    "contract_end_date" DATE,
    "daily_base_cost" DECIMAL(10,2) DEFAULT 0,
    "hourly_cost" DECIMAL(10,2),
    "quality_rating" DECIMAL(5,2) DEFAULT 0,
    "performance_score" DECIMAL(5,2) DEFAULT 0,
    "compliance_status" VARCHAR(20) DEFAULT 'valid',
    "license_number" VARCHAR(100),
    "license_expiration_date" DATE,
    "medical_visit_expiration" DATE,
    "status" VARCHAR(50) DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plate_number" VARCHAR(50) NOT NULL,
    "internal_code" VARCHAR(50),
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "category" VARCHAR(50) DEFAULT 'van',
    "fuel_type" VARCHAR(50) DEFAULT 'diesel',
    "year" INTEGER,
    "current_km" INTEGER DEFAULT 0,
    "internal_cost_per_km" DECIMAL(10,2) DEFAULT 0,
    "fixed_monthly_cost" DECIMAL(10,2) DEFAULT 0,
    "insurance_monthly_cost" DECIMAL(10,2) DEFAULT 0,
    "rental_monthly_cost" DECIMAL(10,2) DEFAULT 0,
    "status" VARCHAR(50) DEFAULT 'active',
    "last_maintenance_km" INTEGER,
    "next_maintenance_km" INTEGER,
    "insurance_expiration_date" DATE,
    "technical_inspection_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "difficulty_multiplier" DECIMAL(5,2) DEFAULT 1,
    "zone_type" VARCHAR(50) DEFAULT 'urban',
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "client_code" VARCHAR(50),
    "contract_type" VARCHAR(100),
    "billing_contact_name" VARCHAR(255),
    "billing_contact_email" VARCHAR(255),
    "billing_contact_phone" VARCHAR(50),
    "sla_penalty_rules" JSONB,
    "payment_terms_days" INTEGER,
    "status" VARCHAR(50) DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pricing_mode" VARCHAR(50) DEFAULT 'per_package',
    "unit_price_stop" DECIMAL(10,2) DEFAULT 0,
    "unit_price_package" DECIMAL(10,2) DEFAULT 0,
    "bonus_relay_point" DECIMAL(10,2) DEFAULT 0,
    "base_daily_flat" DECIMAL(10,2) DEFAULT 0,
    "active_from" DATE,
    "active_to" DATE,
    "status" VARCHAR(50) DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_runs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "rate_card_id" UUID,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "zone_id" UUID,
    "run_code" VARCHAR(100),
    "date" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'planned',
    "departure_time" TIMESTAMPTZ(6),
    "return_time" TIMESTAMPTZ(6),
    "run_duration_minutes" INTEGER DEFAULT 0,
    "km_start" INTEGER DEFAULT 0,
    "km_end" INTEGER DEFAULT 0,
    "km_total" INTEGER DEFAULT 0,
    "fuel_consumed_liters" DECIMAL(8,2) DEFAULT 0,
    "stops_planned" INTEGER DEFAULT 0,
    "stops_completed" INTEGER DEFAULT 0,
    "stops_failed" INTEGER DEFAULT 0,
    "packages_loaded" INTEGER DEFAULT 0,
    "packages_delivered" INTEGER DEFAULT 0,
    "packages_relay" INTEGER DEFAULT 0,
    "packages_returned" INTEGER DEFAULT 0,
    "packages_advised" INTEGER DEFAULT 0,
    "notes" TEXT,
    "revenue_calculated" DECIMAL(10,2) DEFAULT 0,
    "cost_driver" DECIMAL(10,2) DEFAULT 0,
    "cost_vehicle" DECIMAL(10,2) DEFAULT 0,
    "cost_fuel" DECIMAL(10,2) DEFAULT 0,
    "cost_other" DECIMAL(10,2) DEFAULT 0,
    "total_cost" DECIMAL(10,2) DEFAULT 0,
    "margin_net" DECIMAL(10,2) DEFAULT 0,
    "productivity_index" DECIMAL(5,2) DEFAULT 0,
    "penalty_risk_score" DECIMAL(5,2) DEFAULT 0,
    "sst_score" DECIMAL(5,2) DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "daily_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "driver_id" UUID,
    "vehicle_id" UUID,
    "incident_type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) DEFAULT 'low',
    "description" TEXT,
    "gps_latitude" DECIMAL(10,6),
    "gps_longitude" DECIMAL(10,6),
    "distance_from_delivery_point" INTEGER,
    "photo_evidence_url" VARCHAR(1024),
    "video_evidence_url" VARCHAR(1024),
    "audio_evidence_url" VARCHAR(1024),
    "ai_validation_flag" BOOLEAN DEFAULT false,
    "ai_risk_score" DECIMAL(5,2) DEFAULT 0,
    "penalty_exposure_amount" DECIMAL(10,2) DEFAULT 0,
    "penalty_saved_amount" DECIMAL(10,2) DEFAULT 0,
    "resolution_status" VARCHAR(50) DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_log" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "run_id" UUID,
    "driver_id" UUID,
    "vehicle_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "event_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gps_latitude" DECIMAL(10,6),
    "gps_longitude" DECIMAL(10,6),
    "source" VARCHAR(50),
    "metadata_json" JSONB,

    CONSTRAINT "events_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "run_id" UUID,
    "liters" DECIMAL(8,2) NOT NULL,
    "price_per_liter" DECIMAL(8,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "station_name" VARCHAR(255),
    "receipt_url" VARCHAR(1024),
    "fueled_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "maintenance_type" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2) NOT NULL,
    "km_at_service" INTEGER DEFAULT 0,
    "next_service_km" INTEGER,
    "immobilization_days" INTEGER DEFAULT 0,
    "vendor_name" VARCHAR(255),
    "service_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" VARCHAR(50) DEFAULT 'planned',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "run_id" UUID,
    "client_id" UUID,
    "vehicle_id" UUID,
    "driver_id" UUID,
    "entry_type" VARCHAR(50) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "entry_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "report_type" VARCHAR(100) NOT NULL,
    "report_period_start" DATE,
    "report_period_end" DATE,
    "generated_text" TEXT NOT NULL,
    "structured_data_json" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_org" ON "users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE INDEX "idx_drivers_org" ON "drivers"("organization_id");

-- CreateIndex
CREATE INDEX "idx_vehicles_org" ON "vehicles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_zones_org" ON "zones"("organization_id");

-- CreateIndex
CREATE INDEX "idx_clients_org" ON "clients"("organization_id");

-- CreateIndex
CREATE INDEX "idx_rate_cards_org" ON "rate_cards"("organization_id");

-- CreateIndex
CREATE INDEX "idx_daily_runs_org_date" ON "daily_runs"("organization_id", "date");

-- CreateIndex
CREATE INDEX "idx_daily_runs_fk" ON "daily_runs"("driver_id", "vehicle_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_incidents_org" ON "incidents"("organization_id");

-- CreateIndex
CREATE INDEX "idx_incidents_run" ON "incidents"("run_id");

-- CreateIndex
CREATE INDEX "idx_events_log_time" ON "events_log"("organization_id", "event_timestamp");

-- CreateIndex
CREATE INDEX "idx_fuel_logs_org" ON "fuel_logs"("organization_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_logs_org" ON "maintenance_logs"("organization_id");

-- CreateIndex
CREATE INDEX "idx_hr_events_org" ON "hr_events"("organization_id");

-- CreateIndex
CREATE INDEX "idx_financial_entries_time" ON "financial_entries"("organization_id", "entry_date");

-- CreateIndex
CREATE INDEX "idx_ai_reports_org" ON "ai_reports"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_runs" ADD CONSTRAINT "daily_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_runs" ADD CONSTRAINT "daily_runs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_runs" ADD CONSTRAINT "daily_runs_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_runs" ADD CONSTRAINT "daily_runs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_runs" ADD CONSTRAINT "daily_runs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_runs" ADD CONSTRAINT "daily_runs_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "daily_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_log" ADD CONSTRAINT "events_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_log" ADD CONSTRAINT "events_log_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "daily_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_log" ADD CONSTRAINT "events_log_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_log" ADD CONSTRAINT "events_log_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "daily_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_events" ADD CONSTRAINT "hr_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_events" ADD CONSTRAINT "hr_events_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "daily_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
