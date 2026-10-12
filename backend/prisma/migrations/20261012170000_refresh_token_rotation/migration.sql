-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "rotatedAt" TIMESTAMP(3);

-- Sessione fissa di 3 ore dal login (SESSION_TTL_HOURS): anche i refresh token
-- già emessi, che duravano 30 giorni, scadono a 3 ore dalla loro emissione.
-- Chi ha fatto l'accesso da più di 3 ore lo rifà.
UPDATE "RefreshToken"
SET "expiresAt" = "createdAt" + INTERVAL '3 hours'
WHERE "revokedAt" IS NULL AND "expiresAt" > "createdAt" + INTERVAL '3 hours';
