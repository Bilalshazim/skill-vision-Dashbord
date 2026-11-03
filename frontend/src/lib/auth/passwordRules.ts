// Le regole di una password nuova, le stesse del server (backend
// lib/password.ts): qui servono solo a dire subito cosa manca.
export const PASSWORD_MIN_LENGTH = 14
export const PASSWORD_RULE_HINT = `Almeno ${PASSWORD_MIN_LENGTH} caratteri, con minuscole, maiuscole e cifre.`

export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return `Almeno ${PASSWORD_MIN_LENGTH} caratteri.`
  if (['admin123', 'acme123', 'password', 'skillvision'].some((f) => pw.toLowerCase().includes(f))) return 'Contiene una parola già pubblica: scegline un’altra.'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'Servono almeno una minuscola, una maiuscola e una cifra.'
  return null
}

export function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  for (;;) {
    const out = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => alphabet[b % alphabet.length]).join('')
    if (!passwordProblem(out)) return out
  }
}
