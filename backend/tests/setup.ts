import path from 'node:path'

// Loads .env.test (a separate database from dev — see .env.test) before
// anything else in the suite touches process.env.
process.loadEnvFile(path.resolve(import.meta.dirname, '../.env.test'))
