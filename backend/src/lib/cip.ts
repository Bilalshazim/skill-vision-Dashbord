import type { PrismaClient } from '@prisma/client'

import { ConflictError, NotFoundError } from './errors.js'

// OD-1 boundary. What IS approved (Phase 29B): CIP identifies a Platform,
// is immutable once issued, and a mistake is corrected by voiding and
// reissuing rather than editing in place. What is NOT approved: the exact
// event that should fire this automatically (Platform activation? Company
// onboarding? something else?), whether Platform<->Company is really
// 1:1, and the precise scope of the sequence counter.
//
// So this is a plain, explicitly-invoked function — an admin (or a test)
// calls `generateCip()` naming the owner directly — instead of a lifecycle
// hook wired to "when a Platform activates". Nothing in this codebase
// calls it automatically. When OD-1's remaining questions are answered,
// the fix is wiring a trigger to call this function, not rewriting it.
export async function generateCip(
  prisma: PrismaClient,
  input: { ownerType: 'PLATFORM' | 'COMPANY' | 'CAMPAIGN'; ownerId: string; sellerCodeId: string; generatedById: string },
) {
  const seller = await prisma.sellerCode.findUnique({ where: { id: input.sellerCodeId } })
  if (!seller || !seller.active) throw new NotFoundError('Unknown or inactive seller code')

  const now = new Date()
  const year2 = now.getUTCFullYear() % 100
  const month2 = now.getUTCMonth() + 1

  // Scope assumed here: (year, seller, month) — see the schema comment on
  // Cip and OD-1 in the decision sheet. This is the one place that
  // assumption is encoded; changing the scope later is a change to this
  // query + the @@unique constraint, not a data migration of existing rows.
  return prisma.$transaction(async (tx) => {
    const last = await tx.cip.findFirst({
      where: { year2, sellerCodeId: input.sellerCodeId, month2 },
      orderBy: { sequence: 'desc' },
    })
    const sequence = (last?.sequence ?? 0) + 1
    const code = `CIP ${String(year2).padStart(2, '0')}/${seller.code} ${String(month2).padStart(2, '0')}-${String(sequence).padStart(2, '0')}`

    const existing = await tx.cip.findUnique({ where: { code } })
    if (existing) throw new ConflictError(`CIP collision on ${code} — retry`)

    return tx.cip.create({
      data: {
        code,
        year2,
        month2,
        sequence,
        sellerCodeId: input.sellerCodeId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        generatedById: input.generatedById,
      },
    })
  })
}

export async function voidCip(prisma: PrismaClient, cipId: string, voidedById: string, reason: string) {
  const cip = await prisma.cip.findUnique({ where: { id: cipId } })
  if (!cip) throw new NotFoundError('CIP not found')
  if (cip.status === 'VOIDED') throw new ConflictError('CIP already voided')
  return prisma.cip.update({
    where: { id: cipId },
    data: { status: 'VOIDED', voidedAt: new Date(), voidedById, voidReason: reason },
  })
}
