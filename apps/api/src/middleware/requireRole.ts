import { Response, NextFunction } from "express";
import type { UserRole } from "@repo/types";
import type { AuthRequest } from "./requireAuth";

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Bu işlem için yetkiniz yok" });
      return;
    }
    next();
  };
}
