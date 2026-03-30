import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSubscription,
  TimestampsToReturn,
  ClientMonitoredItem,
  type DataValue,
  type MonitoringParametersOptions,
  type ReadValueIdOptions,
} from "node-opcua";
import { db } from "../db";
import { tsPool } from "../db/timescale";

const OPCUA_URL = process.env.OPCUA_URL ?? "opc.tcp://opcua-server:4840";
const TAGS = ["güç", "tüketim", "sıcaklık", "vibrasyon", "üretim"] as const;

async function insertReading(
  machineId: number,
  tag: string,
  value: number
): Promise<void> {
  await tsPool.query(
    "INSERT INTO machine_readings (time, machine_id, tag, value) VALUES (NOW(), $1, $2, $3)",
    [machineId, tag, value]
  );
}

export async function startOpcuaClient(): Promise<void> {
  const client = OPCUAClient.create({
    applicationName: "AssetManagementClient",
    connectionStrategy: {
      initialDelay: 2000,
      maxRetry: 1e9,
      maxDelay: 15000,
    },
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpointMustExist: false,
  });

  client.on("connection_lost", () =>
    console.warn("[OPC UA] Bağlantı kesildi, yeniden bağlanılıyor...")
  );
  client.on("reconnecting", () =>
    console.log("[OPC UA] Yeniden bağlanılıyor...")
  );
  client.on("connected", () => console.log("[OPC UA] Bağlandı."));

  console.log(`[OPC UA] Bağlanıyor → ${OPCUA_URL}`);
  await client.connect(OPCUA_URL);
  const session = await client.createSession();

  const machineList = await db.query.machines.findMany({
    columns: { id: true, code: true },
  });

  console.log(
    `[OPC UA] ${machineList.length} makine × ${TAGS.length} tag = ${machineList.length * TAGS.length} monitored item`
  );

  const subscription = ClientSubscription.create(session, {
    requestedPublishingInterval: 2000,
    requestedLifetimeCount: 100,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 200,
    publishingEnabled: true,
    priority: 10,
  });

  const monitoringParams: MonitoringParametersOptions = {
    samplingInterval: 2000,
    discardOldest: true,
    queueSize: 10,
  };

  for (const machine of machineList) {
    for (const tag of TAGS) {
      const nodeId = `ns=1;s=Machine_${machine.code}_${tag}`;
      const itemToMonitor: ReadValueIdOptions = {
        nodeId,
        attributeId: AttributeIds.Value,
      };

      const monitoredItem = ClientMonitoredItem.create(
        subscription,
        itemToMonitor,
        monitoringParams,
        TimestampsToReturn.Both
      );

      // Closure ile machineId ve tag'i yakala
      const machineId = machine.id;
      const tagName = tag;

      monitoredItem.on("changed", (dataValue: DataValue) => {
        const raw = dataValue.value?.value;
        if (raw == null) return;
        const value = Number(raw);
        if (isNaN(value)) return;
        insertReading(machineId, tagName, value).catch((err) =>
          console.error("[OPC UA] Yazma hatası:", err)
        );
      });
    }
  }

  console.log("[OPC UA] Subscription aktif.");

  process.on("SIGINT", async () => {
    await subscription.terminate();
    await session.close();
    await client.disconnect();
  });
}
