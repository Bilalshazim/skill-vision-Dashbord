import type { Prisma, PrismaClient } from '@prisma/client'

// §10, §19: append-only, system-written only — nothing outside this
// function ever writes to AuditLog directly.
export async function audit(
  prisma: PrismaClient,
  entry: { actorUserId: string | null; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> },
) {
  await prisma.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
    },
  })
}
