import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId || "unknown";
  const timestamp = new Date().toISOString();

  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let message = "Internal Server Error";
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.status || err.statusCode) {
    statusCode = err.status || err.statusCode;
    message = err.message || message;
    errorCode = statusCode < 500 ? "CLIENT_ERROR" : "INTERNAL_ERROR";
    isOperational = statusCode < 500;
  } else if (err.message) {
    message = err.message;
  }

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    errorCode = "INVALID_JSON";
    message = "Invalid JSON in request body";
    isOperational = true;
  }

  if (!isOperational) {
    console.error(`[ERROR] Unhandled error [${requestId}]:`, err);
  } else {
    console.warn(`[WARN] Operational error [${requestId}]: ${errorCode} - ${message}`);
  }

  if (!res.headersSent) {
    res.status(statusCode).json({
      error: {
        message,
        code: errorCode,
        statusCode,
        requestId,
        timestamp,
      },
    });
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  if (req.path.startsWith("/api/")) {
    next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, "ROUTE_NOT_FOUND"));
  } else {
    next();
  }
}
