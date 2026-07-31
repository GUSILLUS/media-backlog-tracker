import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../../generated/prisma/models";
import { UserRepository } from "../../db";

const hashPassword = async (plainPassword: string) => await bcrypt.hash(plainPassword, 10);
const validatePassword = async (plainPassword: string, hashedPassword: string) => await bcrypt.compare(plainPassword, hashedPassword);

const signToken = async (payload: any) => await jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7h" });

const secureUser = (user: UserModel) => {
  const { passwordHash, ...userWithoutPassword } = user;
  return { ...userWithoutPassword };
};

const verifyToken = async (token: string) => {
  try {
    return await jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

const registerUser = async (user: UserModel, password: string) => {
  const passwordHash = await hashPassword(password);

  const newUser = { ...user, password: passwordHash };

  const createdUser = await UserRepository.createUser(newUser);

  const securedUser = secureUser(createdUser);

  return securedUser;
}

const loginUser = async (email: string, password: string) => {
  const user = await UserRepository.findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const securedUser = secureUser(user);
  
  const isPasswordValid = await validatePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const token = await signToken({ id: user.id, email: user.email });
  return { user: securedUser, token };
}

const AuthService = {
  registerUser,
  loginUser,
  verifyToken,
};

export default AuthService;