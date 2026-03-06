-- Rescue migration: idempotently add columns that may be missing
-- due to migration drift (migration registered as applied but ALTER TABLE never executed)

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE "PlanTier" AS ENUM ('free', 'esencial', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanStatus" AS ENUM ('inactive', 'active', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add columns to users if they don't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" "PlanTier" NOT NULL DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_status" "PlanStatus" NOT NULL DEFAULT 'inactive';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_activated_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_expires_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mp_payment_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMPTZ(6);

-- Add columns to invitations/guests if they don't exist (from migration 20260305000000)
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "invitations_slug_key" ON "invitations"("slug");
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "guest_message" TEXT;
