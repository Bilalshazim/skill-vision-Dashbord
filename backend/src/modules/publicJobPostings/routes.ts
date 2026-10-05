import { Router } from 'express'

import { NotFoundError, TooManyRequestsError } from '../../lib/errors.js'
import { createLimiter } from '../../lib/rateLimit.js'
import { prisma } from '../../lib/prisma.js'

// Fase 5 (Roberto Feliciani) — la pagina pubblica dell'annuncio. Il link di
// pubblicazione che l'approvazione di un profilo di lavoro genera
// (`.../jd/<codice>`) finora non portava da nessuna parte: questo è il
// pezzo che mancava. Senza accesso, per costruzione: chi ha il link vede
// l'annuncio, e solo se il profilo è ancora approvato (togliere l'approvazione
// spegne il link).
//
// Si espone il minimo: titolo, intestazione, sezioni, competenze, richieste
// aggiuntive. Non escono fasce retributive, id, autori, date né la campagna.
export const publicJobPostingsRouter = Router()

const limiter = createLimiter({ max: 60, windowMs: 60_000 })
const TOKEN = /^[a-f0-9]{24}$/

publicJobPostingsRouter.get('/:token', async (req, res, next) => {
  try {
    if (!limiter.hit(req.ip ?? 'unknown').allowed) throw new TooManyRequestsError('Troppe richieste, riprova fra poco.')
    if (!TOKEN.test(req.params.token)) throw new NotFoundError('Annuncio non trovato')
    const profile = await prisma.jobProfile.findFirst({
      where: { approved: true, publicationLink: { endsWith: `/jd/${req.params.token}` } },
      select: { title: true, header: true, sections: true, hardSkillGroups: true, extraRequirements: true },
    })
    if (!profile) throw new NotFoundError('Annuncio non trovato')
    res.set('Cache-Control', 'no-store').json(profile)
  } catch (err) {
    next(err)
  }
})
