import { Router, Request, Response } from "express";
import { z } from "zod";
import { loginUser, getMe } from "./auth.service";
import { requireAuth, AuthRequest } from "../../middleware/requireAuth";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, error: "Geçersiz istek" });
    return;
  }

  try {
    const data = await loginUser(result.data.username, result.data.password);
    res.json({ success: true, data });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err instanceof Error ? err.message : "Giriş başarısız",
    });
  }
});

authRouter.post("/logout", requireAuth, (_req: Request, res: Response) => {
  res.json({ success: true, data: { message: "Çıkış yapıldı" } });
});

authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await getMe((req as AuthRequest).user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err instanceof Error ? err.message : "Kullanıcı bulunamadı",
    });
  }
});
