import { UserModel } from "./generated/prisma/models";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateSessionInput, SessionOutput, sessionSelect } from "./types/session";
import { CreateUserInput, userSelect, userSelectWithPassword } from "./types/user";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});


const UserRepository = {
  createUser: async (payload: CreateUserInput) => {
    return await prisma.user.create({
      data: payload,
      select: userSelect,
    });
  },

  findUserByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  },

  findUserByEmailWithPassword: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      select: userSelectWithPassword,
    });
  },

  findUserById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  deleteUserById: async (id: string) => {
    return await prisma.user.deleteMany({
      where: { id }
    });
  }
}

const SessionRepository = {
  createSession: async ({userId, tokenHash, expiresAt}: CreateSessionInput) => {
    return await prisma.session.create({
      data: { userId, tokenHash, expiresAt }
    });
  },

  findValidSessionByTokenHash: async (tokenHash: string) => {
    return await prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      select: sessionSelect,
    });
  },

  findAllSessionsByUserId: async (userId: string) => {
    return await prisma.session.findMany({
      where: { userId },
      select: sessionSelect,
    });
  },

  deleteSessionById: async (id: string) => {
    return await prisma.session.deleteMany({
      where: { OR: [{ id }, { expiresAt: { lt: new Date() } }] }
    });
  },

  deleteAllSessionsByUserId: async (userId: string) => {
    return await prisma.session.deleteMany({
      where: { userId }
    });
  },

  deleteExpiredSessions: async () => {
    return await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
  }
}


export { UserRepository, SessionRepository };
