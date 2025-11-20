-- CreateEnum
CREATE TYPE "Side" AS ENUM ('bride', 'groom');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'confirmed', 'declined');

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "table_number" TEXT,
    "message" TEXT,
    "event_date" DATE,
    "location" TEXT,
    "qr_code" TEXT,
    "operation_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "invitation_id" UUID,
    "operation_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invitations_table_number_idx" ON "invitations"("table_number");

-- CreateIndex
CREATE INDEX "invitations_operation_id_idx" ON "invitations"("operation_id");

-- CreateIndex
CREATE INDEX "guests_invitation_id_idx" ON "guests"("invitation_id");

-- CreateIndex
CREATE INDEX "guests_status_idx" ON "guests"("status");

-- CreateIndex
CREATE INDEX "guests_operation_id_idx" ON "guests"("operation_id");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
