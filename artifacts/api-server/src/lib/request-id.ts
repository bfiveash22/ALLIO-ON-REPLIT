import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.requestId = (req.headers["x-request-id"] as string) || generateRequestId();
  next();
}
