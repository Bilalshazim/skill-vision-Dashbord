import { BadGatewayError, BadRequestError } from './errors.js'
import { env } from './env.js'

// Una chiamata al modello, solo lato server: la chiave non arriva mai al
// browser e non viene mai registrata né restituita. Usata dalla sintesi delle
// valutazioni (modules/evaluators). Senza ANTHROPIC_API_KEY risponde con un
// errore chiaro invece di far fallire l'avvio del server.
export async function askClaude(input: { system: string; user: string; maxTokens?: number }): Promise<string> {
  if (!env.anthropicApiKey) {
    throw new BadRequestError("La sintesi IA non è attiva su questo server: manca la configurazione (ANTHROPIC_API_KEY).")
  }
  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.anthropicApiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: env.aiModel,
        max_tokens: input.maxTokens ?? 1500,
        system: input.system,
        messages: [{ role: 'user', content: input.user }],
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch {
    throw new BadGatewayError('Il servizio di intelligenza artificiale non risponde.')
  }
  if (!response.ok) {
    // Il corpo dell'errore può citare il contenuto inviato: non lo si
    // restituisce né lo si registra, solo il codice.
    throw new BadGatewayError(`Il servizio di intelligenza artificiale ha risposto ${response.status}.`)
  }
  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.find((b) => b.type === 'text')?.text
  if (!text) throw new BadGatewayError('Il servizio di intelligenza artificiale non ha restituito testo.')
  return text
}
