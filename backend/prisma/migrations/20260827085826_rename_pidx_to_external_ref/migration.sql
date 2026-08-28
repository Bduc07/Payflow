-- Rename Khalti-specific "pidx" to a gateway-agnostic name now that a
-- second gateway (eSewa) needs to store its own external reference too.
ALTER TABLE "Transaction" RENAME COLUMN "pidx" TO "externalRef";
ALTER INDEX "Transaction_pidx_key" RENAME TO "Transaction_externalRef_key";
