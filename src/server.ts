import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Next.js default port
      "http://localhost:3001", // Alternative Next.js port
      "http://localhost:4000", // Another common port
      process.env.CORS_ORIGIN || "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" } // append mode
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, "error.log"),
  { flags: "a" } // append mode
);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  // Console logging for development (colored)
  app.use(morgan("dev"));
  // Also save to file in development
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  // Production: only file logging
  app.use(morgan("combined", { stream: accessLogStream }));

  // Error logging for production
  app.use(
    morgan("combined", {
      stream: errorLogStream,
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Grace Jewelry Store API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      products: "/api/products",
    },
    documentation: "Visit /health for API status",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Grace Jewelry Store API is running!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Grace Jewelry Store API is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
