-- AlterTable: Add deletedAt to tables
ALTER TABLE "tables" ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- AlterTable: Add deletedAt to invitations
ALTER TABLE "invitations" ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- AlterTable: Add deletedAt to guests
ALTER TABLE "guests" ADD COLUMN "deleted_at" TIMESTAMPTZ(6);
