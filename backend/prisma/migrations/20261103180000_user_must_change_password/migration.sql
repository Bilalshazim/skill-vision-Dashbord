-- Primo accesso: chi riceve la password dall'amministratore deve sceglierne
-- una propria prima di usare l'applicazione (Impostazioni → Utenti).
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
