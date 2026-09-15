import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { TOKEN_TTL_SECONDS } from "./auth.constants";
import { UserModel } from "../../generated/prisma/models";
import { UserRepository } from "../../db";
import { LoginUserPayload, RegisterUserPayload } from "./auth.types";
import {
  EmailInUseError,
  InvalidCredentialsError,
  InvalidTokenError,
} from "./auth.errors";

const hashPassword = async (plainPassword: string) => await bcrypt.hash(plainPassword, 10);
const validatePassword = async (plainPassword: string, hashedPassword: string) =>
  await bcrypt.compare(plainPassword, hashedPassword);

// A throwaway hash compared against when the email doesn't exist, so a missing
// user and a wrong password take roughly the same time -> no user enumeration
// by timing. Computed once at startup.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("unused-placeholder-password", 10);

const signToken = async (payload: { id: string }): Promise<string> =>
  await jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: TOKEN_TTL_SECONDS });

const secureUser = (user: UserModel) => {
  const { password, ...userWithoutPassword } = user;
  return { ...userWithoutPassword };
};

const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded === "string") {
      throw new InvalidTokenError();
    }
    return decoded;
  } catch {
    throw new InvalidTokenError();
  }
};

const isEmailUsed = async (email: string) => {
  const existingUser = await UserRepository.findUserByEmail(email);
  return !!existingUser;
};

const registerUser = async (registerPayload: RegisterUserPayload) => {
  const existingUser = await UserRepository.findUserByEmail(registerPayload.email);
  if (existingUser) {
    throw new EmailInUseError();
  }

  const passwordHash = await hashPassword(registerPayload.password);
  const newUser = { ...registerPayload, password: passwordHash };
  const createdUser = await UserRepository.createUser(newUser);

  return secureUser(createdUser);
};

const loginUser = async (loginPayload: LoginUserPayload) => {
  const user = await UserRepository.findUserByEmail(loginPayload.email);

  // Always run a compare (dummy hash when no user) for constant-ish timing.
  const isPasswordValid = await validatePassword(
    loginPayload.password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  // Same error for "no such user" and "wrong password" -> no enumeration.
  if (!user || !isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const token = await signToken({ id: user.id });
  return { user: secureUser(user), token };
};

const AuthService = {
  registerUser,
  loginUser,
  verifyToken,
  isEmailUsed,
  secureUser,
};

export default AuthService;
