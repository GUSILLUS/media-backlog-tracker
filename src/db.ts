import { UserModel } from "./generated/prisma/models";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

const createUser = async (payload: UserModel) => {
  return await prisma.user.create({
    data: payload
  });
}

const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  });
}

const UserRepository = {
  createUser,
  findUserByEmail,
}

export { prisma, UserRepository };

