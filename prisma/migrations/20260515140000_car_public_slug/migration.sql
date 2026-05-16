-- AlterTable (superseded by follow-up migration that aligns column name with Prisma)
ALTER TABLE "cars" ADD COLUMN "public_slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cars_public_slug_key" ON "cars"("public_slug");
