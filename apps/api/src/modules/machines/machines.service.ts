import { eq } from "drizzle-orm";
import { db } from "../../db";
import { machines } from "../../db/schema";
import type { CreateMachineDto, UpdateMachineDto } from "@repo/types";

export async function getAllMachines() {
  return db.query.machines.findMany({
    orderBy: (m, { asc }) => [asc(m.code)],
  });
}

export async function getMachineById(id: number) {
  const machine = await db.query.machines.findFirst({
    where: eq(machines.id, id),
  });
  if (!machine) throw new Error("Makine bulunamadı");
  return machine;
}

export async function createMachine(dto: CreateMachineDto) {
  const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : undefined;
  const [machine] = await db
    .insert(machines)
    .values({ ...dto, purchaseDate })
    .returning();
  return machine;
}

export async function updateMachine(id: number, dto: UpdateMachineDto) {
  await getMachineById(id); // 404 kontrolü
  const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : undefined;
  const [machine] = await db
    .update(machines)
    .set({ ...dto, purchaseDate, updatedAt: new Date() })
    .where(eq(machines.id, id))
    .returning();
  return machine;
}

export async function deleteMachine(id: number) {
  await getMachineById(id); // 404 kontrolü
  await db.delete(machines).where(eq(machines.id, id));
}
