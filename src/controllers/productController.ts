import { Request, Response } from "express";
import { prisma } from "../utils/database";
import { formatResponse } from "../utils/auth";
import {
  CreateProductRequest,
  UpdateProductRequest,
  AuthenticatedRequest,
} from "../types";

// Helper function to convert form-data values to boolean
const parseBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "yes";
  }
  return false;
};

// Helper function to safely convert form-data values
const parseFormValue = (value: any): string | undefined => {
  return value ? value.toString() : undefined;
};

// Helper function to get the correct image URL based on environment
const getImageUrl = (filename: string): string => {
  const storageType = process.env.STORAGE_TYPE || "local";

  switch (storageType) {
    case "local":
      return `/uploads/products/${filename}`;
    case "cloudinary":
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${filename}`;
    case "s3":
      return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
    default:
      return `/uploads/products/${filename}`;
  }
};

export const createProduct = async (
  req: Request<{}, {}, CreateProductRequest>,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      category,
      material,
      weight,
      dimensions,
      gemstone,
      stock = 0,
      isActive = true,
    } = req.body;

    // Validation
    if (!name || !price || !category) {
      res
        .status(400)
        .json(formatResponse(false, "Name, price, and category are required"));
      return;
    }

    if (parseFloat(price.toString()) <= 0) {
      res
        .status(400)
        .json(formatResponse(false, "Price must be greater than 0"));
      return;
    }

    // Handle uploaded images
    const uploadedFiles = req.files as Express.Multer.File[];
    const imageUrls: string[] = [];

    if (uploadedFiles && uploadedFiles.length > 0) {
      // Generate URLs for uploaded images
      uploadedFiles.forEach((file) => {
        // Create URL path for the uploaded image using environment-aware helper
        const imageUrl = getImageUrl(file.filename);
        imageUrls.push(imageUrl);
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        category: category.toString().toUpperCase() as any,
        material,
        weight: weight ? parseFloat(weight.toString()) : null,
        dimensions,
        gemstone,
        images: imageUrls, // Use uploaded image URLs
        stock: parseInt(stock.toString()),
        isActive: parseBoolean(isActive),
      },
    });

    res
      .status(201)
      .json(formatResponse(true, "Product created successfully", product));
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "10",
      category,
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { material: { contains: search, mode: "insensitive" } },
        { gemstone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json(
      formatResponse(true, "Products retrieved successfully", {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          total,
          limit: limitNum,
        },
      })
    );
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json(formatResponse(false, "Product not found"));
      return;
    }

    res
      .status(200)
      .json(formatResponse(true, "Product retrieved successfully", product));
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const getProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          category: category.toUpperCase(),
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.product.count({
        where: {
          category: category.toUpperCase(),
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json(
      formatResponse(true, "Products retrieved successfully", {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          total,
          limit: limitNum,
        },
      })
    );
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const updateProduct = async (
  req: Request<{ id: string }, {}, UpdateProductRequest>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      material,
      weight,
      dimensions,
      gemstone,
      stock,
      isActive,
      replaceImages, // New field to determine if we should replace all images
    } = req.body;

    // Validation
    if (price !== undefined && parseFloat(price.toString()) <= 0) {
      res
        .status(400)
        .json(formatResponse(false, "Price must be greater than 0"));
      return;
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json(formatResponse(false, "Product not found"));
      return;
    }

    // Handle uploaded images
    const uploadedFiles = req.files as Express.Multer.File[];
    let imageUrls: string[] = existingProduct.images; // Keep existing images by default

    if (uploadedFiles && uploadedFiles.length > 0) {
      const newImageUrls: string[] = [];

      // Generate URLs for new uploaded images
      uploadedFiles.forEach((file) => {
        const imageUrl = `/uploads/products/${file.filename}`;
        newImageUrls.push(imageUrl);
      });

      // If replaceImages is true, replace all images. Otherwise, add to existing
      if (parseBoolean(replaceImages)) {
        imageUrls = newImageUrls;
      } else {
        imageUrls = [...existingProduct.images, ...newImageUrls];
      }
    }

    // Prepare update data with proper type conversion
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price.toString());
    if (category !== undefined) updateData.category = category;
    if (material !== undefined) updateData.material = material;
    if (weight !== undefined)
      updateData.weight = weight ? parseFloat(weight.toString()) : null;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (gemstone !== undefined) updateData.gemstone = gemstone;
    if (stock !== undefined) updateData.stock = parseInt(stock.toString());
    if (isActive !== undefined) updateData.isActive = parseBoolean(isActive);

    // Always update images if we processed any files
    if (uploadedFiles && uploadedFiles.length > 0) {
      updateData.images = imageUrls;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res
      .status(200)
      .json(formatResponse(true, "Product updated successfully", product));
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json(formatResponse(false, "Product not found"));
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.status(200).json(formatResponse(true, "Product deleted successfully"));
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json(formatResponse(false, "Internal server error"));
  }
};
