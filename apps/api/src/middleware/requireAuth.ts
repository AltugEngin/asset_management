import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@repo/types";

export interface AuthRequest extends Request {
  user: {
    id: number;
    username: string;
    role: UserRole;
    groupId: number;
  };
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Kimlik doğrulama gerekli" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      username: string;
      role: UserRole;
      groupId: number;
    };
    (req as AuthRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Geçersiz veya süresi dolmuş token" });
  }
}
