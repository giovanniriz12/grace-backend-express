import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWTPayload } from "../types";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// In-memory blacklist for logged out tokens
// In production, you'd use Redis or a database
const tokenBlacklist = new Set<string>();

export const generateToken = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    throw new Error("Token has been invalidated");
  }

  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
  console.log(`Token blacklisted: ${token.substring(0, 20)}...`);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

// Clean up expired tokens from blacklist periodically
export const cleanupBlacklist = (): void => {
  const now = Math.floor(Date.now() / 1000);

  tokenBlacklist.forEach((token) => {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded && decoded.exp && decoded.exp < now) {
        tokenBlacklist.delete(token);
      }
    } catch (error) {
      // Invalid token, remove it
      tokenBlacklist.delete(token);
    }
  });
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const formatResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
) => {
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };
};
