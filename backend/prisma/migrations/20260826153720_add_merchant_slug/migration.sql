-- AlterTable: add slug as nullable first so existing rows don't break
ALTER TABLE "Merchant" ADD COLUMN "slug" TEXT;

-- Backfill the one existing merchant row
UPDATE "Merchant" SET "slug" = 'himalayan-mart' WHERE "email" = 'himalayan@gmail.com';

-- Now that every row has a value, enforce NOT NULL and uniqueness
ALTER TABLE "Merchant" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");
