import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface JWTPayload extends JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  role?: "ADMIN" | "SUPER_ADMIN";
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category:
    | "RINGS"
    | "NECKLACES"
    | "EARRINGS"
    | "BRACELETS"
    | "WATCHES"
    | "BROOCHES"
    | "PENDANTS"
    | "SETS"
    | "OTHER";
  material?: string;
  weight?: number;
  dimensions?: string;
  gemstone?: string;
  images?: string[];
  stock?: number;
  isActive?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
