import bcrypt from "bcryptjs";
import { SESSION_TTL_MS } from "./auth.constants";
import { SessionRepository, UserRepository } from "../../db";
import { LoginUserPayload, RegisterUserPayload } from "./auth.types";
import {
  EmailInUseError,
  InvalidCredentialsError,
  InvalidSessionError,
} from "./auth.errors";
import { SessionOutput } from "../../types/session";
import { generateSessionToken, hashSessionToken } from "./session.crypto";
import { UserOutputWithPassword } from "../../types/user";
import { Prisma } from "../../generated/prisma/client";


const hashPassword = async (plainPassword: string) => await bcrypt.hash(plainPassword, 10);
const validatePassword = async (plainPassword: string, hashedPassword: string) =>
  await bcrypt.compare(plainPassword, hashedPassword);

// A throwaway hash compared against when the email doesn't exist, so a missing
// user and a wrong password take roughly the same time -> no user enumeration
// by timing. Computed once at startup.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("unused-placeholder-password", 10);

const secureUser = (user: UserOutputWithPassword) => {
  const { password, ...userWithoutPassword } = user;
  return { ...userWithoutPassword };
};

const verifySession = async (rawSessionToken: string): Promise<SessionOutput> => {
  const sessionTokenHash = hashSessionToken(rawSessionToken);

  const session = await SessionRepository.findValidSessionByTokenHash(sessionTokenHash);

  if (session === null) {
    throw new InvalidSessionError();
  }

  return session;
};

const revokeSession = async (sessionId: string): Promise<void> => {
  const deletedCount = await SessionRepository.deleteSessionById(sessionId);

  if (deletedCount.count === 0) {
    throw new InvalidSessionError();
  }
}

const registerUser = async (registerPayload: RegisterUserPayload) => {
  try {
  const existingUser = await UserRepository.findUserByEmail(registerPayload.email);

  if (existingUser) {
    throw new EmailInUseError();
  }

  const passwordHash = await hashPassword(registerPayload.password);
  const newUser = { ...registerPayload, password: passwordHash };
  const createdUser = await UserRepository.createUser(newUser);

  return createdUser;
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new EmailInUseError();
  }
}
};

const loginUser = async (loginPayload: LoginUserPayload) => {
  const user = await UserRepository.findUserByEmailWithPassword(loginPayload.email);

  // Always run a compare (dummy hash when no user) for constant-ish timing.
  const isPasswordValid = await validatePassword(
    loginPayload.password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  // Same error for "no such user" and "wrong password" -> no enumeration.
  if (!user || !isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const sessionRawToken = generateSessionToken();

  const session = await SessionRepository.createSession({
    userId: user.id,
    tokenHash: hashSessionToken(sessionRawToken),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return { user: secureUser(user), sessionRawToken };
};

const AuthService = {
  registerUser,
  loginUser,
  verifySession,
  secureUser,
  revokeSession
};

export default AuthService;
