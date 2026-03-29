import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  setUserActive,
} from "./users.service";

export const usersRouter = Router();

usersRouter.use(requireAuth);

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  groupId: z.number().int().positive(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  groupId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// Kullanıcı listesi — admin, direktör, müdür
usersRouter.get(
  "/",
  requireRole("admin", "direktör", "müdür"),
  async (_req: Request, res: Response) => {
    try {
      const data = await getAllUsers();
      // Şifreyi gizle
      const sanitized = data.map(({ password: _, ...u }) => u);
      res.json({ success: true, data: sanitized });
    } catch {
      res.status(500).json({ success: false, error: "Sunucu hatası" });
    }
  }
);

// Kullanıcı detayı — admin, direktör, müdür (şef/mühendis sadece kendi profilini görebilir)
usersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const authReq = req as AuthRequest;

    const allowedRoles = ["admin", "direktör", "müdür"];
    const isSelf = authReq.user.id === id;

    if (!allowedRoles.includes(authReq.user.role) && !isSelf) {
      res.status(403).json({ success: false, error: "Bu işlem için yetkiniz yok" });
      return;
    }

    const user = await getUserById(id);
    const { password: _, ...sanitized } = user;
    res.json({ success: true, data: sanitized });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err instanceof Error ? err.message : "Kullanıcı bulunamadı",
    });
  }
});

// Kullanıcı oluştur — sadece admin
usersRouter.post(
  "/",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    try {
      const user = await createUser(result.data);
      const { password: _, ...sanitized } = user;
      res.status(201).json({ success: true, data: sanitized });
    } catch (err) {
      res.status(409).json({
        success: false,
        error: err instanceof Error ? err.message : "Kullanıcı oluşturulamadı",
      });
    }
  }
);

// Kullanıcı güncelle — sadece admin
usersRouter.put(
  "/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: "Geçersiz veri", details: result.error.issues });
      return;
    }
    try {
      const user = await updateUser(parseInt(req.params.id), result.data);
      const { password: _, ...sanitized } = user;
      res.json({ success: true, data: sanitized });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Kullanıcı güncellenemedi",
      });
    }
  }
);

// Kullanıcı sil — sadece admin
usersRouter.delete(
  "/:id",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    if (authReq.user.id === parseInt(req.params.id)) {
      res.status(400).json({ success: false, error: "Kendi hesabınızı silemezsiniz" });
      return;
    }
    try {
      await deleteUser(parseInt(req.params.id));
      res.json({ success: true, data: { message: "Kullanıcı silindi" } });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err instanceof Error ? err.message : "Kullanıcı silinemedi",
      });
    }
  }
);

// Aktif/pasif yap — sadece admin
usersRouter.patch(
  "/:id/activate",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const user = await setUserActive(parseInt(req.params.id), true);
      const { password: _, ...sanitized } = user;
      res.json({ success: true, data: sanitized });
    } catch (err) {
      res.status(404).json({ success: false, error: err instanceof Error ? err.message : "Hata" });
    }
  }
);

usersRouter.patch(
  "/:id/deactivate",
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const user = await setUserActive(parseInt(req.params.id), false);
      const { password: _, ...sanitized } = user;
      res.json({ success: true, data: sanitized });
    } catch (err) {
      res.status(404).json({ success: false, error: err instanceof Error ? err.message : "Hata" });
    }
  }
);
