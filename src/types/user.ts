import { Prisma } from "../generated/prisma/client";
import { UserModel } from "../generated/prisma/models";

export const userSelect = { id: true, email: true, name: true, avatarUrl: true } satisfies Prisma.UserSelect;
export const userSelectWithPassword = { ...userSelect, password: true } satisfies Prisma.UserSelect;

export type CreateUserInput = Pick<UserModel, "email" | "name" | "password">;
export type UserOutput = Prisma.UserGetPayload<{
  select: typeof userSelect
}>
export type UserOutputWithPassword = Prisma.UserGetPayload<{
  select: typeof userSelectWithPassword
}>
