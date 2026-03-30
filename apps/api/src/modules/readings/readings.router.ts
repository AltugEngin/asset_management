import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import {
  getReadings,
  getLatestReadings,
  type RangeOption,
} from "./readings.service";

export const readingsRouter = Router();

readingsRouter.use(requireAuth);

// GET /api/v1/readings/:machineId/latest
readingsRouter.get("/:machineId/latest", async (req, res) => {
  const machineId = parseInt(req.params.machineId, 10);
  if (isNaN(machineId)) {
    res.status(400).json({ success: false, error: "Geçersiz makine ID" });
    return;
  }
  const data = await getLatestReadings(machineId);
  res.json({ success: true, data });
});

// GET /api/v1/readings/:machineId?tag=güç&range=1h
readingsRouter.get("/:machineId", async (req, res) => {
  const machineId = parseInt(req.params.machineId, 10);
  if (isNaN(machineId)) {
    res.status(400).json({ success: false, error: "Geçersiz makine ID" });
    return;
  }

  const tag = req.query.tag as string | undefined;
  if (!tag) {
    res.status(400).json({ success: false, error: "tag parametresi zorunlu" });
    return;
  }

  const range = (req.query.range as string) ?? "1h";
  const validRanges: RangeOption[] = ["15m", "1h", "6h", "24h", "7d"];
  if (!validRanges.includes(range as RangeOption)) {
    res
      .status(400)
      .json({ success: false, error: "Geçersiz range (15m|1h|6h|24h|7d)" });
    return;
  }

  const data = await getReadings(machineId, tag, range as RangeOption);
  res.json({ success: true, data });
});
