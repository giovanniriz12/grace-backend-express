import { Request, Response } from "express";
import { prisma } from "../utils/database";
import {
  hashPassword,
  comparePassword,
  generateToken,
  formatResponse,
} from "../utils/auth";
import { AuthenticatedRequest } from "../types";

export const signup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, username, password, role = "ADMIN" } = req.body;

    // Validation
    if (!email || !username || !password) {
      res
        .status(400)
        .json(
          formatResponse(false, "Email, username, and password are required")
        );
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json(
          formatResponse(false, "Password must be at least 6 characters long")
        );
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res
        .status(409)
        .json(
          formatResponse(
            false,
            "User with this email or username already exists"
          )
        );
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role as "ADMIN" | "SUPER_ADMIN",
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    res
      .status(201)
      .json(formatResponse(true, "User created successfully", { user, token }));
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res
        .status(400)
        .json(formatResponse(false, "Email and password are required"));
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json(formatResponse(false, "Invalid credentials"));
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json(formatResponse(false, "Invalid credentials"));
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    };

    res
      .status(200)
      .json(
        formatResponse(true, "Login successful", { user: userResponse, token })
      );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json(formatResponse(false, "User not found"));
      return;
    }

    res.status(200).json(formatResponse(true, "Profile retrieved successfully", user));
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};
