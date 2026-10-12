import { Prisma } from "../generated/prisma/client";
import { SessionModel } from "../generated/prisma/models";

export const sessionSelect = { id: true, userId: true, expiresAt: true } satisfies Prisma.SessionSelect;

export type CreateSessionInput = Pick<SessionModel, "userId" | "tokenHash" | "expiresAt">
export type SessionOutput = Prisma.SessionGetPayload<{
  select: typeof sessionSelect
}>