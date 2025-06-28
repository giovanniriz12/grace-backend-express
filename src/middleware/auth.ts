import { Request, Response, NextFunction } from "express";
import { verifyToken, formatResponse } from "../utils/auth";
import { AuthenticatedRequest } from "../types";

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(formatResponse(false, "Access token required"));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res
      .status(403)
      .json(formatResponse(false, "Invalid or expired token"));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json(formatResponse(false, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json(formatResponse(false, "Insufficient permissions"));
    }

    next();
  };
};
