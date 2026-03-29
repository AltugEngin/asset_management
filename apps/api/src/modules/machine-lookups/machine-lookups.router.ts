import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  machineNames,
  machineLocations,
  machineManufacturers,
} from "../../db/schema";

export const machineLookupsRouter = Router();

machineLookupsRouter.use(requireAuth);

const nameSchema = z.object({ name: z.string().min(1).max(200) });

// ─── Machine Names ────────────────────────────────────────────────────────────

machineLookupsRouter.get("/names", async (_req: Request, res: Response) => {
  const data = await db.query.machineNames.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
  res.json({ success: true, data });
});

machineLookupsRouter.post(
  "/names",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = nameSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri" });
      return;
    }
    try {
      const [row] = await db
        .insert(machineNames)
        .values({ name: result.data.name })
        .returning();
      res.status(201).json({ success: true, data: row });
    } catch {
      res.status(409).json({ success: false, error: "Bu ad zaten mevcut" });
    }
  }
);

machineLookupsRouter.delete(
  "/names/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    await db
      .delete(machineNames)
      .where(eq(machineNames.id, parseInt(req.params.id as string)));
    res.json({ success: true, data: { message: "Silindi" } });
  }
);

// ─── Machine Locations ────────────────────────────────────────────────────────

machineLookupsRouter.get("/locations", async (_req: Request, res: Response) => {
  const data = await db.query.machineLocations.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
  res.json({ success: true, data });
});

machineLookupsRouter.post(
  "/locations",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = nameSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri" });
      return;
    }
    try {
      const [row] = await db
        .insert(machineLocations)
        .values({ name: result.data.name })
        .returning();
      res.status(201).json({ success: true, data: row });
    } catch {
      res.status(409).json({ success: false, error: "Bu konum zaten mevcut" });
    }
  }
);

machineLookupsRouter.delete(
  "/locations/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    await db
      .delete(machineLocations)
      .where(eq(machineLocations.id, parseInt(req.params.id as string)));
    res.json({ success: true, data: { message: "Silindi" } });
  }
);

// ─── Machine Manufacturers ────────────────────────────────────────────────────

machineLookupsRouter.get(
  "/manufacturers",
  async (_req: Request, res: Response) => {
    const data = await db.query.machineManufacturers.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
    });
    res.json({ success: true, data });
  }
);

machineLookupsRouter.post(
  "/manufacturers",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = nameSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri" });
      return;
    }
    try {
      const [row] = await db
        .insert(machineManufacturers)
        .values({ name: result.data.name })
        .returning();
      res.status(201).json({ success: true, data: row });
    } catch {
      res.status(409).json({ success: false, error: "Bu üretici zaten mevcut" });
    }
  }
);

machineLookupsRouter.delete(
  "/manufacturers/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    await db
      .delete(machineManufacturers)
      .where(
        eq(machineManufacturers.id, parseInt(req.params.id as string))
      );
    res.json({ success: true, data: { message: "Silindi" } });
  }
);
