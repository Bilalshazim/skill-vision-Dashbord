import type { NextFunction, Request, Response } from 'express'

import { AppError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

// §1: one place every thrown error funnels through — the Blueprint §4 error
// shape (`{ error: { code, message } }`) is produced here, nowhere else.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, path: req.path }, 'request failed')
    return res.status(err.status).json({ error: { code: err.code, message: err.message } })
  }
  logger.error({ err, path: req.path }, 'unhandled error')
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } })
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` } })
}
