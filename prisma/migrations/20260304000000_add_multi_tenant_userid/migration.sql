-- AlterTable: Add userId to tables
ALTER TABLE "tables" ADD COLUMN "user_id" UUID NOT NULL;

-- AlterTable: Add userId to invitations
ALTER TABLE "invitations" ADD COLUMN "user_id" UUID NOT NULL;

-- AlterTable: Add userId to guests
ALTER TABLE "guests" ADD COLUMN "user_id" UUID NOT NULL;

-- DropIndex: Remove global unique constraint on table name
DROP INDEX "tables_name_key";

-- CreateIndex: Add composite unique constraint (userId + name) on tables
CREATE UNIQUE INDEX "tables_user_id_name_key" ON "tables"("user_id", "name");

-- CreateIndex: Add index on userId for tables
CREATE INDEX "tables_user_id_idx" ON "tables"("user_id");

-- CreateIndex: Add index on userId for invitations
CREATE INDEX "invitations_user_id_idx" ON "invitations"("user_id");

-- CreateIndex: Add index on userId for guests
CREATE INDEX "guests_user_id_idx" ON "guests"("user_id");

-- AddForeignKey: tables.user_id -> users.id
ALTER TABLE "tables" ADD CONSTRAINT "tables_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: invitations.user_id -> users.id
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: guests.user_id -> users.id
ALTER TABLE "guests" ADD CONSTRAINT "guests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
