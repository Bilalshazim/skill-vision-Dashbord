# PostgreSQL locale

Per lavorare a backend e frontend senza Railway e senza installare
PostgreSQL nel sistema. Serve internet solo la prima volta (`npm install`).

```bash
cd backend/local-db
npm install
npm start
```

Usa `DATABASE_URL` di `backend/.env` (e di `.env.test`, se c'è): stessa
porta, crea i database se mancano. Risponde solo su localhost, senza
password. Poi, in un altro terminale:

```bash
cd backend
npx prisma migrate deploy
npm run seed
npm run dev
```

I dati stanno in `data/` (fuori dal repository). Per ripartire da zero: si
ferma il database e si cancella `data/`.

Non entra nella build: Railway installa solo `backend/package.json`, e in
produzione il database è quello di Railway.
