import { createApp } from './app.js'
import { env } from './lib/env.js'
import { logger } from './lib/logger.js'
import { prisma } from './lib/prisma.js'

const app = createApp()

const server = app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Recruiting backend listening')
})

// Phase 34 §18 — stop accepting new connections, let in-flight requests
// finish, then close the database connection, instead of dropping
// requests mid-flight on a deploy/restart (the previous version had no
// shutdown handling at all — a real production-operations gap, not a
// hypothetical one: any process manager sends SIGTERM on redeploy).
let shuttingDown = false
function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down')
  server.close(async (err) => {
    if (err) logger.error({ err }, 'Error while closing HTTP server')
    try {
      await prisma.$disconnect()
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Error while disconnecting Prisma')
    }
    process.exit(err ? 1 : 0)
  })
  // Force-exit if something is still hanging (a stuck connection, etc.)
  // well past any realistic in-flight request duration.
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
