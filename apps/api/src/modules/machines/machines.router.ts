import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from "./machines.service";

export const machinesRouter = Router();

machinesRouter.use(requireAuth);

const machineSchema = z.object({
  code: z.string().min(1).max(50),
  nameId: z.number().int().positive(),
  description: z.string().optional(),
  locationId: z.number().int().positive().optional(),
  status: z.enum(["aktif", "pasif", "bakımda"]).optional(),
  manufacturerId: z.number().int().positive().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
});

const updateMachineSchema = machineSchema.partial();

// Makine listesi — tüm roller
machinesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await getAllMachines();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Sunucu hatası" });
  }
});

// Makine detayı — tüm roller
machinesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await getMachineById(parseInt(req.params.id as string));
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err instanceof Error ? err.message : "Makine bulunamadı",
    });
  }
});

// Makine oluştur — admin, müdür
machinesRouter.post(
  "/",
  requireRole("admin", "müdür"),
  async (req: Request, res: Response) => {
    const result = machineSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    try {
      const data = await createMachine(result.data);
      res.status(201).json({ success: true, data });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: err instanceof Error ? err.message : "Makine oluşturulamadı",
      });
    }
  }
);

// Makine güncelle — admin, müdür, şef
machinesRouter.put(
  "/:id",
  requireRole("admin", "müdür", "şef"),
  async (req: Request, res: Response) => {
    const result = updateMachineSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    try {
      const data = await updateMachine(parseInt(req.params.id as string), result.data);
      res.json({ success: true, data });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Makine güncellenemedi",
      });
    }
  }
);

// Makine sil — sadece admin
machinesRouter.delete(
  "/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      await deleteMachine(parseInt(req.params.id as string));
      res.json({ success: true, data: { message: "Makine silindi" } });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Makine silinemedi",
      });
    }
  }
);
