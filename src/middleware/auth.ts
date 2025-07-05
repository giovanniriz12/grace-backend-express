import { Request, Response, NextFunction } from "express";
import { verifyToken, formatResponse } from "../utils/auth";
import { AuthenticatedRequest } from "../types";

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json(formatResponse(false, "Access token required"));
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Token has been invalidated"
    ) {
      res.status(401).json(formatResponse(false, "Token has been invalidated"));
    } else {
      res.status(403).json(formatResponse(false, "Invalid or expired token"));
    }
    return;
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
