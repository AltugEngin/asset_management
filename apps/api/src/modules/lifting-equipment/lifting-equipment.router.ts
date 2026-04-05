import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  getAllLiftingEquipment,
  getLiftingEquipmentById,
  createLiftingEquipment,
  updateLiftingEquipment,
  deleteLiftingEquipment,
} from "./lifting-equipment.service";

export const liftingEquipmentRouter = Router();

liftingEquipmentRouter.use(requireAuth);

const equipmentSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  group: z.enum(["manlift", "vinç", "sepet"]),
  description: z.string().optional(),
});

const updateEquipmentSchema = equipmentSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

// Tüm ekipmanlar — tüm roller
liftingEquipmentRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await getAllLiftingEquipment();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Sunucu hatası" });
  }
});

// Ekipman detayı — tüm roller
liftingEquipmentRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const data = await getLiftingEquipmentById(parseInt(req.params.id as string));
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err instanceof Error ? err.message : "Ekipman bulunamadı",
    });
  }
});

// Ekipman oluştur — admin
liftingEquipmentRouter.post(
  "/",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = equipmentSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    try {
      const data = await createLiftingEquipment(result.data);
      res.status(201).json({ success: true, data });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: err instanceof Error ? err.message : "Ekipman oluşturulamadı",
      });
    }
  }
);

// Ekipman güncelle — admin
liftingEquipmentRouter.put(
  "/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = updateEquipmentSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    try {
      const data = await updateLiftingEquipment(parseInt(req.params.id as string), result.data);
      res.json({ success: true, data });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Ekipman güncellenemedi",
      });
    }
  }
);

// Ekipman sil — admin
liftingEquipmentRouter.delete(
  "/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      await deleteLiftingEquipment(parseInt(req.params.id as string));
      res.json({ success: true, data: { message: "Ekipman silindi" } });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Ekipman silinemedi",
      });
    }
  }
);
