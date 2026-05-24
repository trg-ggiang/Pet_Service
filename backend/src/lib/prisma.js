const isPrismaConfigured = Boolean(process.env.DATABASE_URL);

let prismaClient = null;

function getPrismaClient() {
  if (!isPrismaConfigured) {
    throw new Error("Missing DATABASE_URL in backend/.env for Prisma");
  }

  if (!prismaClient) {
    const { PrismaClient } = require("@prisma/client");
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

module.exports = {
  getPrismaClient,
  isPrismaConfigured,
};