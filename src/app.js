import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

// Import routes
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Set-Cookie",
  ],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Movie Watchlist API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);

// Global error handler
app.use(errorHandler);

// Handle 404 for all other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
    error: "ROUTE_NOT_FOUND",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Movie Watchlist API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);

  if (process.env.NODE_ENV === "development") {
    console.log(`📝 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth Routes: http://localhost:${PORT}/api/auth`);
    console.log(`🎬 Movie Routes: http://localhost:${PORT}/api/movies`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📴 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("📴 SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
});

export default app;
