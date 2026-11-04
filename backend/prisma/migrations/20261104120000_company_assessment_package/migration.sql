-- Il pacchetto di Assessment acquistato dalla società (A = CT, B = CP,
-- AB = Completo). Le società esistenti restano su Completo: nessuno perde una vista.
ALTER TABLE "Company" ADD COLUMN "assessmentPackage" "AssessmentModulo" NOT NULL DEFAULT 'AB';
