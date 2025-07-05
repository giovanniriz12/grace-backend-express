import { Router } from "express";
import {
  signup,
  login,
  getProfile,
  logout,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, getProfile);
router.post("/logout", authenticateToken, logout);

export default router;
