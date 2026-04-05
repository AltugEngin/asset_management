import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { AuthRequest } from "../../middleware/requireAuth";
import {
  getAllEquipmentRequests,
  getMyEquipmentRequests,
  createEquipmentRequest,
  reviewEquipmentRequest,
} from "./equipment-requests.service";

export const equipmentRequestsRouter = Router();

equipmentRequestsRouter.use(requireAuth);

const createRequestSchema = z.object({
  equipmentId: z.number().int().positive(),
  machineId: z.number().int().positive().optional(),
  reason: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
});

const reviewRequestSchema = z.object({
  status: z.enum(["onaylandı", "reddedildi"]),
});

// Tüm talepler — admin ve üstü
equipmentRequestsRouter.get(
  "/",
  requireRole("admin", "direktör", "müdür", "şef"),
  async (_req: Request, res: Response) => {
    try {
      const data = await getAllEquipmentRequests();
      res.json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: "Sunucu hatası" });
    }
  }
);

// Kendi taleplerim — mühendis
equipmentRequestsRouter.get(
  "/my",
  requireRole("mühendis"),
  async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    try {
      const data = await getMyEquipmentRequests(user.id);
      res.json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: "Sunucu hatası" });
    }
  }
);

// Talep oluştur — sadece mühendis
equipmentRequestsRouter.post(
  "/",
  requireRole("mühendis"),
  async (req: Request, res: Response) => {
    const result = createRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    const user = (req as AuthRequest).user;
    try {
      const data = await createEquipmentRequest({
        ...result.data,
        requestedById: user.id,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: err instanceof Error ? err.message : "Talep oluşturulamadı",
      });
    }
  }
);

// Talebi onayla/reddet — sadece admin
equipmentRequestsRouter.patch(
  "/:id/review",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = reviewRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    const user = (req as AuthRequest).user;
    try {
      const data = await reviewEquipmentRequest(
        parseInt(req.params.id as string),
        user.id,
        result.data.status
      );
      res.json({ success: true, data });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Talep güncellenemedi",
      });
    }
  }
);
