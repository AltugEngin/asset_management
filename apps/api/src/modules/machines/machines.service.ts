import { eq } from "drizzle-orm";
import { db } from "../../db";
import { machines } from "../../db/schema";
import type { CreateMachineDto, UpdateMachineDto } from "@repo/types";

function mapMachine(
  row: Awaited<ReturnType<typeof fetchMachines>>[number]
) {
  return {
    ...row,
    name: row.machineName.name,
    location: row.machineLocation?.name ?? null,
    manufacturer: row.machineManufacturer?.name ?? null,
  };
}

function fetchMachines() {
  return db.query.machines.findMany({
    orderBy: (m, { asc }) => [asc(m.code)],
    with: {
      machineName: true,
      machineLocation: true,
      machineManufacturer: true,
    },
  });
}

function fetchMachineById(id: number) {
  return db.query.machines.findFirst({
    where: eq(machines.id, id),
    with: {
      machineName: true,
      machineLocation: true,
      machineManufacturer: true,
    },
  });
}

export async function getAllMachines() {
  const rows = await fetchMachines();
  return rows.map(mapMachine);
}

export async function getMachineById(id: number) {
  const row = await fetchMachineById(id);
  if (!row) throw new Error("Makine bulunamadı");
  return mapMachine(row);
}

export async function createMachine(dto: CreateMachineDto) {
  const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : undefined;
  const [inserted] = await db
    .insert(machines)
    .values({ ...dto, purchaseDate })
    .returning();
  return getMachineById(inserted.id);
}

export async function updateMachine(id: number, dto: UpdateMachineDto) {
  await getMachineById(id); // 404 kontrolü
  const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : undefined;
  const [updated] = await db
    .update(machines)
    .set({ ...dto, purchaseDate, updatedAt: new Date() })
    .where(eq(machines.id, id))
    .returning();
  return getMachineById(updated.id);
}

export async function deleteMachine(id: number) {
  await getMachineById(id); // 404 kontrolü
  await db.delete(machines).where(eq(machines.id, id));
}
