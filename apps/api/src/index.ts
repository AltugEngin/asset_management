import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { authRouter } from "./modules/auth/auth.router";
import { usersRouter } from "./modules/users/users.router";
import { machinesRouter } from "./modules/machines/machines.router";
import { userGroupsRouter } from "./modules/user-groups/user-groups.router";
import { machineLookupsRouter } from "./modules/machine-lookups/machine-lookups.router";
import { readingsRouter } from "./modules/readings/readings.router";
import { liftingEquipmentRouter } from "./modules/lifting-equipment/lifting-equipment.router";
import { equipmentRequestsRouter } from "./modules/equipment-requests/equipment-requests.router";
import { setupTimescale } from "./db/timescale-setup";
import { startOpcuaClient } from "./opcua/client";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/machines", machinesRouter);
app.use("/api/v1/user-groups", userGroupsRouter);
app.use("/api/v1/machine-lookups", machineLookupsRouter);
app.use("/api/v1/readings", readingsRouter);
app.use("/api/v1/lifting-equipment", liftingEquipmentRouter);
app.use("/api/v1/equipment-requests", equipmentRequestsRouter);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, async () => {
  console.log(`API sunucusu ${PORT} portunda çalışıyor`);

  if (process.env.TIMESCALE_URL) {
    try {
      await setupTimescale();
    } catch (err) {
      console.error("TimescaleDB kurulum hatası:", err);
    }
  }

  if (process.env.OPCUA_URL) {
    startOpcuaClient().catch((err) =>
      console.error("OPC UA client hatası:", err)
    );
  }
});
