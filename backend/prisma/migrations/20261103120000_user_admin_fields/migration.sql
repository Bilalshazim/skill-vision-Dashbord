-- Gestione utenti dalle Impostazioni: nome utente per l'accesso, mansione
-- descrittiva e versione della sessione (cambio password = uscita immediata).
-- Solo colonne nuove, facoltative o con valore predefinito.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "designation" TEXT;
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
