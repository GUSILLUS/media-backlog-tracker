import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserModel } from "../../generated/prisma/models";
import { UserRepository } from "../../db";
import { LoginUserPayload, RegisterUserPayload } from "./auth.types";

const hashPassword = async (plainPassword: string) => await bcrypt.hash(plainPassword, 10);
const validatePassword = async (plainPassword: string, hashedPassword: string) => await bcrypt.compare(plainPassword, hashedPassword);

const signToken = async (payload: { id: string }): Promise<string> => await jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7h" });

const secureUser = (user: UserModel) => {
  const { password, ...userWithoutPassword } = user;

  return { ...userWithoutPassword };
};

const verifyToken = async (token: string): Promise<JwtPayload | string> => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

const isEmailUsed = async (email: string) => {
  const existingUser = await UserRepository.findUserByEmail(email);
  return !!existingUser;
}

const registerUser = async (registerPayload: RegisterUserPayload) => {
  const existingUser = await UserRepository.findUserByEmail(registerPayload.email);

  const passwordHash = await hashPassword(registerPayload.password);

  const newUser = { ...registerPayload, password: passwordHash };

  const createdUser = await UserRepository.createUser(newUser);

  const securedUser = secureUser(createdUser);

  return securedUser;
}

const loginUser = async (loginPayload: LoginUserPayload) => {
  const user = await UserRepository.findUserByEmail(loginPayload.email);

  if (!user) {
    throw new Error("User not found");
  }

  const securedUser = secureUser(user);
  
  const isPasswordValid = await validatePassword(loginPayload.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = await signToken({ id: user.id });
  return { user: securedUser, token };
}

const AuthService = {
  registerUser,
  loginUser,
  verifyToken,
  isEmailUsed,
  secureUser,
};

export default AuthService;