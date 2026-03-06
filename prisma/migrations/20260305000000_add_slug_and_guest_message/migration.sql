-- AlterTable
ALTER TABLE "invitations" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invitations_slug_key" ON "invitations"("slug");

-- AlterTable
ALTER TABLE "guests" ADD COLUMN "guest_message" TEXT;
