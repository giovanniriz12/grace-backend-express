import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from "../controllers/productController";
import { authenticateToken, requireRole } from "../middleware/auth";
import { uploadImages } from "../middleware/upload";

const router = Router();

// Public routes - order matters! More specific routes first
router.get("/", getAllProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProductById);

// Protected routes (Admin only)
router.post(
  "/",
  authenticateToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  uploadImages, // Add image upload middleware
  createProduct
);
router.put(
  "/:id",
  authenticateToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  uploadImages, // Add image upload middleware for updates
  updateProduct
);
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  deleteProduct
);

export default router;
