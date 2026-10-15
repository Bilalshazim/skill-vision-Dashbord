-- Assessment sul server, Parte 3: l'invio del link al test di Assessment non
-- ha una configurazione mittente di Recruiting. La colonna diventa facoltativa;
-- le righe di Recruiting restano come sono.
ALTER TABLE "TestInvitation" ALTER COLUMN "senderConfigId" DROP NOT NULL;
