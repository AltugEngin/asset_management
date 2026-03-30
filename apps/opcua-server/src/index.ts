import { MessageSecurityMode, OPCUAServer, SecurityPolicy } from "node-opcua";
import { Pool } from "pg";
import { buildMachineNodes } from "./nodes";
import { createInitialState, tick, type MachineState } from "./simulation";

const PORT = parseInt(process.env.OPCUA_PORT ?? "4840", 10);
const DB_URL = process.env.DATABASE_URL;

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

  const server = new OPCUAServer({
    port: PORT,
    resourcePath: "/UA/AssetManagement",
    buildInfo: {
      productName: "AssetManagement OPC UA Server",
      buildNumber: "1",
      buildDate: new Date(),
    },
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
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
  console.log(
    `${states.size} makine, ${states.size * 5} node aktif.`
  );

  // Simülasyon döngüsü: her 2 saniyede bir state'i güncelle
  setInterval(() => {
    for (const state of states.values()) {
      tick(state);
    }
  }, 2000);

  process.on("SIGINT", async () => {
    console.log("Server kapatılıyor...");
    await server.shutdown(1000);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("OPC UA Server başlatma hatası:", err);
  process.exit(1);
});
