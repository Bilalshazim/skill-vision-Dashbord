-- «Dati dell'azienda» in Dati aziendali (Decisioni di Roberto del 2026-11-12). Solo aggiunta:
-- sedi, contatti e ruoli chiave già salvati restano come sono.
ALTER TABLE "AssessmentCompanyProfile" ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}';
