import jwt from "jsonwebtoken";
const { TokenExpiredError } = jwt;

class SendError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "SendError";
  }
}

class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(message = "Resource not found", statusCode = 404) {
    super(message);
    this.statusCode = statusCode;
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized", statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends Error {
  constructor(message = "Forbidden", statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ForbiddenError";
  }
}

const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // JWT Token Expired Error
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token has expired",
      error: "TOKEN_EXPIRED",
    });
  }

  // Custom Application Errors
  if (
    err instanceof SendError ||
    err instanceof ValidationError ||
    err instanceof NotFoundError ||
    err instanceof UnauthorizedError ||
    err instanceof ForbiddenError
  ) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      error: err.name,
    });
  }

  // Database Constraint Errors (PostgreSQL)
  if (err.code === "23505") {
    // unique_violation
    const detail = err.detail || err.message;
    let field = "field";

    if (detail.includes("username")) {
      field = "username";
    } else if (detail.includes("email")) {
      field = "email";
    }

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      error: "DUPLICATE_ENTRY",
    });
  }

  if (err.code === "23503") {
    // foreign_key_violation
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Referenced record does not exist",
      error: "FOREIGN_KEY_VIOLATION",
    });
  }

  if (err.code === "23502") {
    // not_null_violation
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Field '${err.column}' cannot be null`,
      error: "REQUIRED_FIELD_MISSING",
    });
  }

  // Express Validation Errors
  if (err.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: messages[0] || "Validation failed",
      error: "VALIDATION_ERROR",
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Something went wrong",
    error: "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 Not Found Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
    error: "ROUTE_NOT_FOUND",
  });
};

export {
  SendError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  notFoundHandler,
};
