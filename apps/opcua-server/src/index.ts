import { MessageSecurityMode, OPCUAServer, SecurityPolicy } from "node-opcua";
import { Pool } from "pg";
import { buildMachineNodes } from "./nodes";
import { createInitialState, tick, type MachineState } from "./simulation";
import { READING_TAGS } from "@repo/types";

const PORT = parseInt(process.env.OPCUA_PORT ?? "4840", 10);
const DB_URL = process.env.DATABASE_URL;
const TS_URL = process.env.TIMESCALE_URL;

async function getMachinesFromDb(): Promise<{ id: number; code: string }[]> {
  const pool = new Pool({ connectionString: DB_URL });
  try {
    const { rows } = await pool.query<{ id: number; code: string }>(
      "SELECT id, code FROM machines ORDER BY code"
    );
    return rows;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("Veritabanından makine listesi alınıyor...");
  const machineRows = await getMachinesFromDb();
  console.log(`${machineRows.length} makine bulundu.`);

  // Mutable state nesneleri — OPC UA node get() fonksiyonları bunları okur
  const states = new Map<string, MachineState>();
  for (const m of machineRows) {
    states.set(m.code, createInitialState(m.id, m.code));
  }

  // TimescaleDB bağlantısı
  const tsPool = TS_URL ? new Pool({ connectionString: TS_URL }) : null;
  if (tsPool) {
    console.log("TimescaleDB bağlantısı hazır.");
  } else {
    console.warn("TIMESCALE_URL tanımlı değil, okumalar kaydedilmeyecek.");
  }

  const server = new OPCUAServer({
    port: PORT,
    resourcePath: "/UA/AssetManagement",
    buildInfo: {
      productName: "AssetManagement OPC UA Server",
      buildNumber: "1",
      buildDate: new Date(),
    },
    securityModes: [MessageSecurityMode.None],
    securityPolicies: [SecurityPolicy.None],
    allowAnonymous: true,
  });

  await server.initialize();

  const addressSpace = server.engine.addressSpace!;
  const namespace = addressSpace.getOwnNamespace();

  const machinesFolder = namespace.addFolder("ObjectsFolder", {
    browseName: "Machines",
    displayName: "Makineler",
  });

  for (const state of states.values()) {
    buildMachineNodes(namespace, machinesFolder, state);
  }

  await server.start();
  const endpoints = server.endpoints;
  console.log(
    `OPC UA Server başlatıldı → ${endpoints[0]?.endpointDescriptions()[0]?.endpointUrl ?? `opc.tcp://0.0.0.0:${PORT}`}`
  );
  console.log(`${states.size} makine, ${states.size * 5} node aktif.`);

  // Simülasyon döngüsü: her 2 saniyede bir state'i güncelle
  setInterval(() => {
    for (const state of states.values()) {
      tick(state);
    }
  }, 2000);

  // TimescaleDB yazma döngüsü: her 5 saniyede bir tüm tag değerlerini kaydet
  if (tsPool) {
    setInterval(async () => {
      const now = new Date();
      const rows: { machineId: number; tag: string; value: number }[] = [];

      for (const state of states.values()) {
        for (const tag of READING_TAGS) {
          const value = (state as unknown as Record<string, unknown>)[tag];
          if (typeof value === "number") {
            rows.push({ machineId: state.id, tag, value });
          }
        }
      }

      try {
        await tsPool.query(
          `INSERT INTO machine_readings (time, machine_id, tag, value)
           SELECT $1, unnest($2::int[]), unnest($3::text[]), unnest($4::float8[])`,
          [
            now,
            rows.map((r) => r.machineId),
            rows.map((r) => r.tag),
            rows.map((r) => r.value),
          ]
        );
      } catch (err) {
        console.error("TimescaleDB yazma hatası:", err);
      }
    }, 5000);
  }

  process.on("SIGINT", async () => {
    console.log("Server kapatılıyor...");
    await server.shutdown(1000);
    if (tsPool) await tsPool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("OPC UA Server başlatma hatası:", err);
  process.exit(1);
});
