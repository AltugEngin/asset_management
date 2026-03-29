import { Router, Request, Response } from "express";
import { db } from "../../db";
import { requireAuth } from "../../middleware/requireAuth";

export const userGroupsRouter = Router();

userGroupsRouter.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    const groups = await db.query.userGroups.findMany({
      orderBy: (g, { asc }) => [asc(g.id)],
    });
    res.json({ success: true, data: groups });
  } catch {
    res.status(500).json({ success: false, error: "Sunucu hatası" });
  }
});
