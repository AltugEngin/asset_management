import { Request, Response, NextFunction } from "express";
import type { UserRole } from "@repo/types";
import type { AuthRequest } from "./requireAuth";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ success: false, error: "Bu işlem için yetkiniz yok" });
      return;
    }
    next();
  };
}
