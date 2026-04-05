import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { equipmentRequests, users } from "../../db/schema";

export async function getAllEquipmentRequests() {
  return db.query.equipmentRequests.findMany({
    with: {
      equipment: true,
      machine: true,
      requestedBy: true,
      reviewedBy: true,
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getMyEquipmentRequests(userId: number) {
  return db.query.equipmentRequests.findMany({
    where: eq(equipmentRequests.requestedById, userId),
    with: {
      equipment: true,
      machine: true,
      requestedBy: true,
      reviewedBy: true,
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getEquipmentRequestById(id: number) {
  const request = await db.query.equipmentRequests.findFirst({
    where: eq(equipmentRequests.id, id),
    with: {
      equipment: true,
      machine: true,
      requestedBy: true,
      reviewedBy: true,
    },
  });
  if (!request) throw new Error("Talep bulunamadı");
  return request;
}

export async function createEquipmentRequest(dto: {
  equipmentId: number;
  requestedById: number;
  machineId?: number;
  reason: string;
}) {
  const [request] = await db
    .insert(equipmentRequests)
    .values(dto)
    .returning();
  return getEquipmentRequestById(request.id);
}

export async function reviewEquipmentRequest(
  id: number,
  reviewedById: number,
  status: "onaylandı" | "reddedildi"
) {
  await getEquipmentRequestById(id);
  const [request] = await db
    .update(equipmentRequests)
    .set({
      status,
      reviewedById,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(equipmentRequests.id, id))
    .returning();
  return getEquipmentRequestById(request.id);
}
