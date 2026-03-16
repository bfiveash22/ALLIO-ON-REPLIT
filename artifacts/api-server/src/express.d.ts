import "express";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      email?: string;
      role?: string;
      name?: string;
      wpRoles?: string[];
      firstName?: string;
      lastName?: string;
      wpUserId?: string;
    };
  }
}
