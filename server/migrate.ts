import { pool } from "./db";

// Idempotent startup migrations for the community-agent feature.
// Runs on every boot; every statement is a no-op when already applied.
export async function runMigrations() {
  await pool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent'`);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE commission_type AS ENUM ('driver_onboard', 'customer_first_order');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE commission_status AS ENUM ('pending', 'paid');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL UNIQUE,
      referral_code varchar NOT NULL UNIQUE,
      active boolean NOT NULL DEFAULT true,
      bank_name text,
      branch_code text,
      account_number text,
      account_type text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commissions (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id varchar NOT NULL,
      type commission_type NOT NULL,
      amount decimal(10,2) NOT NULL,
      status commission_status NOT NULL DEFAULT 'pending',
      driver_application_id varchar,
      order_id varchar,
      referred_user_id varchar,
      description text,
      paid_at timestamp,
      paid_by varchar,
      created_at timestamp DEFAULT now()
    )
  `);

  await pool.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by_agent_id varchar`);
  await pool.query(`ALTER TABLE driver_applications ADD COLUMN IF NOT EXISTS submitted_by_agent_id varchar`);

  await pool.query(`
    INSERT INTO app_settings (key, value) VALUES
      ('commission_driver_onboard', '250'),
      ('commission_customer_first_order', '50')
    ON CONFLICT (key) DO NOTHING
  `);

  console.log("[migrate] agent-role migrations applied");
}
