import { PrismaClient } from '@prisma/client'

// Single shared client, matching the frontend's own "one shared instance"
// convention (cf. frontend's shell-bridge singletons).
export const prisma = new PrismaClient()
