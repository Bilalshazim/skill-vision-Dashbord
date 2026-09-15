// Small, explicit error taxonomy — every handler throws one of these and the
// error middleware (src/middleware/errorHandler.ts) maps it to the HTTP
// status + `{ error: { code, message } }` shape from Blueprint §4.
export class AppError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, 'bad_request', message)
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'unauthorized', message)
  }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'forbidden', message)
  }
}
// Same HTTP shape as ForbiddenError (403) but a distinct `code` — thrown
// ONLY by requireRole() (middleware/auth.ts), never by requireCompanyScope.
// The frontend uses this to tell "your JWT's role can't do this" (a stale
// dev/authBridge session mapped to the wrong backend account — re-bridging
// against the CURRENT shell login and retrying once can genuinely fix it)
// apart from a real company-scope violation (re-bridging as the same shell
// user would yield the exact same company and fail again identically, so
// it must never auto-retry). Authorization itself is unchanged — this only
// enriches the error response.
export class RoleForbiddenError extends AppError {
  constructor(message: string) {
    super(403, 'role_forbidden', message)
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'not_found', message)
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'conflict', message)
  }
}
// An upstream/external dependency (real SMTP send, in practice) failed or
// isn't configured — distinct from a 4xx client mistake, so the frontend's
// existing error-handling path shows a real failure instead of the
// existing code ever flipping local UI state to "sent" on a non-2xx.
export class BadGatewayError extends AppError {
  constructor(message = 'Upstream service unavailable') {
    super(502, 'bad_gateway', message)
  }
}
