import { eq } from "drizzle-orm";
import { db } from "../../db";
import { liftingEquipment } from "../../db/schema";

export async function getAllLiftingEquipment() {
  return db.query.liftingEquipment.findMany({
    orderBy: (e, { asc }) => [asc(e.group), asc(e.code)],
  });
}

export async function getLiftingEquipmentById(id: number) {
  const equipment = await db.query.liftingEquipment.findFirst({
    where: eq(liftingEquipment.id, id),
  });
  if (!equipment) throw new Error("Ekipman bulunamadı");
  return equipment;
}

export async function createLiftingEquipment(dto: {
  code: string;
  name: string;
  group: "manlift" | "vinç" | "sepet";
  description?: string;
}) {
  const [equipment] = await db
    .insert(liftingEquipment)
    .values(dto)
    .returning();
  return equipment;
}

export async function updateLiftingEquipment(
  id: number,
  dto: {
    code?: string;
    name?: string;
    group?: "manlift" | "vinç" | "sepet";
    description?: string;
    isAvailable?: boolean;
  }
) {
  await getLiftingEquipmentById(id);
  const [equipment] = await db
    .update(liftingEquipment)
    .set({ ...dto, updatedAt: new Date() })
    .where(eq(liftingEquipment.id, id))
    .returning();
  return equipment;
}

export async function deleteLiftingEquipment(id: number) {
  await getLiftingEquipmentById(id);
  await db.delete(liftingEquipment).where(eq(liftingEquipment.id, id));
}
