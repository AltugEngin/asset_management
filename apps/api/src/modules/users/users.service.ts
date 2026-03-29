import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import type { CreateUserDto, UpdateUserDto } from "@repo/types";

export async function getAllUsers() {
  return db.query.users.findMany({
    with: { group: true },
    orderBy: (u, { asc }) => [asc(u.id)],
  });
}

export async function getUserById(id: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { group: true },
  });
  if (!user) throw new Error("Kullanıcı bulunamadı");
  return user;
}

export async function createUser(dto: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const [user] = await db
    .insert(users)
    .values({ ...dto, password: hashedPassword })
    .returning();
  return getUserById(user.id);
}

export async function updateUser(id: number, dto: UpdateUserDto) {
  await getUserById(id); // 404 kontrolü
  const [user] = await db
    .update(users)
    .set({ ...dto, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return getUserById(user.id);
}

export async function deleteUser(id: number) {
  await getUserById(id); // 404 kontrolü
  await db.delete(users).where(eq(users.id, id));
}

export async function setUserActive(id: number, isActive: boolean) {
  await getUserById(id); // 404 kontrolü
  const [user] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return getUserById(user.id);
}
