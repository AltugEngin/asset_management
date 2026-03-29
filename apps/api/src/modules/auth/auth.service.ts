import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import type { UserRole } from "@repo/types";

export async function loginUser(username: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    with: { group: true },
  });

  if (!user) {
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  if (!user.isActive) {
    throw new Error("Hesabınız devre dışı bırakılmış");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.group.name as UserRole,
    groupId: user.groupId,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });

  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
}

export async function getMe(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { group: true },
  });

  if (!user) throw new Error("Kullanıcı bulunamadı");

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
