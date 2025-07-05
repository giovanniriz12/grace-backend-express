import { Request, Response } from "express";
import { prisma } from "../utils/database";
import { formatResponse } from "../utils/auth";
import {
  CreateProductRequest,
  UpdateProductRequest,
  AuthenticatedRequest,
} from "../types";

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
      images = [],
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

    if (price <= 0) {
      res
        .status(400)
        .json(formatResponse(false, "Price must be greater than 0"));
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        material,
        weight,
        dimensions,
        gemstone,
        images,
        stock,
        isActive,
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
    const updateData = req.body;

    // Validation
    if (updateData.price !== undefined && updateData.price <= 0) {
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
