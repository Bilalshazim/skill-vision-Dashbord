import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

import { BadRequestError } from '../lib/errors.js'

// §1: request validation at the route boundary — every mutating endpoint
// passes its body through a zod schema before touching the database.
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new BadRequestError(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')))
    }
    req.body = result.data
    next()
  }
}
