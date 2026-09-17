import { Router } from 'express'
import { z } from 'zod'

import { BadGatewayError, BadRequestError } from '../../lib/errors.js'
import { env } from '../../lib/env.js'
import { requireAuth } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const assessmentAiRouter = Router()

assessmentAiRouter.use(requireAuth)

// "CONSIDERAZIONI DELL'ESPERTO" — the interview module's own client-side
// state (answers, area-criticality scores, decisions) is sent up as plain
// data; the actual model call happens ONLY here, server-side, so the API
// key never reaches the browser. This replaces the prior architecture's
// unauthenticated client-side fetch to api.anthropic.com (never shipped —
// see AssessmentAiPage.tsx's own comment on why that was removed) with a
// real, authenticated, server-side call.
const expertReviewSchema = z.object({
  companyName: z.string().min(1),
  answers: z.array(z.object({ question: z.string().min(1), answer: z.string() })).min(1),
})

assessmentAiRouter.post('/expert-review', validateBody(expertReviewSchema), async (req, res, next) => {
  try {
    if (!env.anthropicApiKey) {
      throw new BadRequestError('AI expert review is not configured on this server (missing ANTHROPIC_API_KEY)')
    }
    const { companyName, answers } = req.body as z.infer<typeof expertReviewSchema>
    const transcript = answers.map((a) => `Q: ${a.question}\nA: ${a.answer || '(nessuna risposta)'}`).join('\n\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Sei un consulente HR esperto. Rivedi le risposte del colloquio di analisi organizzativa qui sotto per l'azienda "${companyName}" e scrivi 3-5 osservazioni concise e concrete (in italiano) che un consulente condividerebbe con il cliente. Non inventare dati non presenti nelle risposte.\n\n${transcript}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new BadGatewayError(`AI provider error (${response.status}): ${errorBody.slice(0, 300)}`)
    }
    const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
    const text = data.content?.find((block) => block.type === 'text')?.text
    if (!text) throw new BadGatewayError('AI provider returned no text content')

    res.json({ insight: text })
  } catch (err) {
    next(err)
  }
})
