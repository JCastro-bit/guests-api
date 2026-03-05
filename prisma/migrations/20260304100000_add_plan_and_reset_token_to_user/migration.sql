-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'esencial', 'premium');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('inactive', 'active', 'expired');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan" "PlanTier" NOT NULL DEFAULT 'free',
ADD COLUMN "plan_status" "PlanStatus" NOT NULL DEFAULT 'inactive',
ADD COLUMN "plan_activated_at" TIMESTAMPTZ(6),
ADD COLUMN "plan_expires_at" TIMESTAMPTZ(6),
ADD COLUMN "mp_payment_id" TEXT,
ADD COLUMN "reset_token" TEXT,
ADD COLUMN "reset_token_expiry" TIMESTAMPTZ(6);
