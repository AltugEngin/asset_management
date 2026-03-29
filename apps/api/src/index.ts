import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { authRouter } from "./modules/auth/auth.router";
import { usersRouter } from "./modules/users/users.router";
import { machinesRouter } from "./modules/machines/machines.router";
import { userGroupsRouter } from "./modules/user-groups/user-groups.router";

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

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`API sunucusu ${PORT} portunda çalışıyor`);
});
