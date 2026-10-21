-- Tutto sul server, Parte 2: le preferenze dell'interfaccia stanno sull'utente,
-- non nel browser. Solo una colonna nuova, con valore predefinito.
ALTER TABLE "User" ADD COLUMN "preferences" JSONB NOT NULL DEFAULT '{}';
