import { PrismaClient } from "@prisma/client";

declare global {
    var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as {
    prisma?: PrismaClient;
};

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : [],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
