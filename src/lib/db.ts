import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

// Cache in all environments — prevents multiple client instances in the same Lambda container
globalForPrisma.prisma = prisma;
