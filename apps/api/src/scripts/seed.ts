import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "../db/schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Seed başlıyor...");

  // ─── User Groups ─────────────────────────────────────────────────────────

  const groups = await db
    .insert(schema.userGroups)
    .values([
      { name: "admin", description: "Sistem yöneticisi" },
      { name: "direktör", description: "Tesis direktörü" },
      { name: "müdür", description: "Bölüm müdürü" },
      { name: "şef", description: "Vardiya şefi" },
      { name: "mühendis", description: "Saha mühendisi" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`${groups.length} kullanıcı grubu eklendi.`);

  // Grup id'lerini bul
  const allGroups = await db.query.userGroups.findMany();
  const groupMap = Object.fromEntries(allGroups.map((g) => [g.name, g.id]));

  // ─── Users ───────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const usersData = [
    {
      username: "admin",
      email: "admin@tesis.com",
      firstName: "Sistem",
      lastName: "Yöneticisi",
      groupId: groupMap["admin"],
    },
    {
      username: "aydin.kaya",
      email: "aydin.kaya@tesis.com",
      firstName: "Aydın",
      lastName: "Kaya",
      groupId: groupMap["direktör"],
    },
    {
      username: "fatih.arslan",
      email: "fatih.arslan@tesis.com",
      firstName: "Fatih",
      lastName: "Arslan",
      groupId: groupMap["müdür"],
    },
    {
      username: "elif.demir",
      email: "elif.demir@tesis.com",
      firstName: "Elif",
      lastName: "Demir",
      groupId: groupMap["müdür"],
    },
    {
      username: "mehmet.yilmaz",
      email: "mehmet.yilmaz@tesis.com",
      firstName: "Mehmet",
      lastName: "Yılmaz",
      groupId: groupMap["şef"],
    },
    {
      username: "zeynep.celik",
      email: "zeynep.celik@tesis.com",
      firstName: "Zeynep",
      lastName: "Çelik",
      groupId: groupMap["şef"],
    },
    {
      username: "hasan.kurt",
      email: "hasan.kurt@tesis.com",
      firstName: "Hasan",
      lastName: "Kurt",
      groupId: groupMap["mühendis"],
    },
    {
      username: "selin.ozturk",
      email: "selin.ozturk@tesis.com",
      firstName: "Selin",
      lastName: "Öztürk",
      groupId: groupMap["mühendis"],
    },
    {
      username: "burak.sahin",
      email: "burak.sahin@tesis.com",
      firstName: "Burak",
      lastName: "Şahin",
      groupId: groupMap["mühendis"],
    },
    {
      username: "neslihan.aksoy",
      email: "neslihan.aksoy@tesis.com",
      firstName: "Neslihan",
      lastName: "Aksoy",
      groupId: groupMap["mühendis"],
    },
  ];

  const insertedUsers = await db
    .insert(schema.users)
    .values(usersData.map((u) => ({ ...u, password: hashedPassword })))
    .onConflictDoNothing()
    .returning();

  console.log(`${insertedUsers.length} kullanıcı eklendi.`);

  // ─── Machines ────────────────────────────────────────────────────────────

  const insertedMachines = await db
    .insert(schema.machines)
    .values([
      {
        code: "KOM.3060",
        name: "Kompresör 3060",
        description: "Hava kompresörü",
        location: "Üretim Sahası A",
        status: "aktif",
        manufacturer: "Atlas Copco",
      },
      {
        code: "KOM.3133",
        name: "Kompresör 3133",
        description: "Hava kompresörü",
        location: "Üretim Sahası B",
        status: "aktif",
        manufacturer: "Atlas Copco",
      },
      {
        code: "PT913",
        name: "Pompa Türbini 913",
        description: "Su pompası türbini",
        location: "Pompa İstasyonu",
        status: "aktif",
        manufacturer: "Sulzer",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`${insertedMachines.length} makine eklendi.`);
  console.log("Seed tamamlandı.");

  await pool.end();
}

main().catch((err) => {
  console.error("Seed hatası:", err);
  process.exit(1);
});
