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

  const allGroups = await db.query.userGroups.findMany();
  const groupMap = Object.fromEntries(allGroups.map((g) => [g.name, g.id]));

  // ─── Users ───────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const usersData = [
    { username: "admin", email: "admin@tesis.com", firstName: "Sistem", lastName: "Yöneticisi", groupId: groupMap["admin"] },
    { username: "aydin.kaya", email: "aydin.kaya@tesis.com", firstName: "Aydın", lastName: "Kaya", groupId: groupMap["direktör"] },
    { username: "fatih.arslan", email: "fatih.arslan@tesis.com", firstName: "Fatih", lastName: "Arslan", groupId: groupMap["müdür"] },
    { username: "elif.demir", email: "elif.demir@tesis.com", firstName: "Elif", lastName: "Demir", groupId: groupMap["müdür"] },
    { username: "mehmet.yilmaz", email: "mehmet.yilmaz@tesis.com", firstName: "Mehmet", lastName: "Yılmaz", groupId: groupMap["şef"] },
    { username: "zeynep.celik", email: "zeynep.celik@tesis.com", firstName: "Zeynep", lastName: "Çelik", groupId: groupMap["şef"] },
    { username: "hasan.kurt", email: "hasan.kurt@tesis.com", firstName: "Hasan", lastName: "Kurt", groupId: groupMap["mühendis"] },
    { username: "selin.ozturk", email: "selin.ozturk@tesis.com", firstName: "Selin", lastName: "Öztürk", groupId: groupMap["mühendis"] },
    { username: "burak.sahin", email: "burak.sahin@tesis.com", firstName: "Burak", lastName: "Şahin", groupId: groupMap["mühendis"] },
    { username: "neslihan.aksoy", email: "neslihan.aksoy@tesis.com", firstName: "Neslihan", lastName: "Aksoy", groupId: groupMap["mühendis"] },
  ];

  const insertedUsers = await db
    .insert(schema.users)
    .values(usersData.map((u) => ({ ...u, password: hashedPassword })))
    .onConflictDoNothing()
    .returning();

  console.log(`${insertedUsers.length} kullanıcı eklendi.`);

  // ─── Machine Lookup Tables ────────────────────────────────────────────────

  const insertedNames = await db
    .insert(schema.machineNames)
    .values([
      { name: "Kompresör 3060" },
      { name: "Kompresör 3133" },
      { name: "Pompa Türbini 913" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`${insertedNames.length} makine adı eklendi.`);

  const insertedLocations = await db
    .insert(schema.machineLocations)
    .values([
      { name: "Üretim Sahası A" },
      { name: "Üretim Sahası B" },
      { name: "Pompa İstasyonu" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`${insertedLocations.length} konum eklendi.`);

  const insertedManufacturers = await db
    .insert(schema.machineManufacturers)
    .values([
      { name: "Atlas Copco" },
      { name: "Sulzer" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`${insertedManufacturers.length} üretici eklendi.`);

  // Lookup id'lerini bul
  const allNames = await db.query.machineNames.findMany();
  const allLocations = await db.query.machineLocations.findMany();
  const allManufacturers = await db.query.machineManufacturers.findMany();

  const nameMap = Object.fromEntries(allNames.map((n) => [n.name, n.id]));
  const locationMap = Object.fromEntries(allLocations.map((l) => [l.name, l.id]));
  const manufacturerMap = Object.fromEntries(allManufacturers.map((m) => [m.name, m.id]));

  // ─── Machines ────────────────────────────────────────────────────────────

  const insertedMachines = await db
    .insert(schema.machines)
    .values([
      {
        code: "KOM.3060",
        nameId: nameMap["Kompresör 3060"],
        description: "Hava kompresörü",
        locationId: locationMap["Üretim Sahası A"],
        status: "aktif",
        manufacturerId: manufacturerMap["Atlas Copco"],
      },
      {
        code: "KOM.3133",
        nameId: nameMap["Kompresör 3133"],
        description: "Hava kompresörü",
        locationId: locationMap["Üretim Sahası B"],
        status: "aktif",
        manufacturerId: manufacturerMap["Atlas Copco"],
      },
      {
        code: "PT913",
        nameId: nameMap["Pompa Türbini 913"],
        description: "Su pompası türbini",
        locationId: locationMap["Pompa İstasyonu"],
        status: "aktif",
        manufacturerId: manufacturerMap["Sulzer"],
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
