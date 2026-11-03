import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// Le regole di una password nuova, uguali per lo script del gruppo di lavoro
// (scripts/create-team-admin.ts) e per la gestione utenti in app
// (modules/users). Restituisce il motivo del rifiuto, o null se va bene.
export const PASSWORD_MIN_LENGTH = 14
// Le password pubbliche del seed e del ponte: mai riusabili.
const FORBIDDEN = ['admin123', 'acme123', 'password', 'skillvision']

export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return `La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri.`
  if (FORBIDDEN.some((f) => pw.toLowerCase().includes(f))) return 'La password contiene una parola già pubblica (seed o ponte del guscio).'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'Servono almeno una minuscola, una maiuscola e una cifra.'
  return null
}
