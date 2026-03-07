-- AlterTable
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "template_id" TEXT;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "style_preset" TEXT;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "color_palette" TEXT;
