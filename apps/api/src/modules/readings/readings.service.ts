import { tsPool } from "../../db/timescale";
import type { ReadingTag } from "@repo/types";

export type RangeOption = "15m" | "1h" | "6h" | "24h" | "7d";

const RANGE_MAP: Record<RangeOption, string> = {
  "15m": "15 minutes",
  "1h": "1 hour",
  "6h": "6 hours",
  "24h": "24 hours",
  "7d": "7 days",
};

export async function getReadings(
  machineId: number,
  tag: string,
  range: RangeOption = "1h"
): Promise<{ time: string; value: number }[]> {
  const interval = RANGE_MAP[range] ?? RANGE_MAP["1h"];
  const { rows } = await tsPool.query<{ time: string; value: number }>(
    `SELECT time, value
     FROM machine_readings
     WHERE machine_id = $1
       AND tag = $2
       AND time > NOW() - INTERVAL '${interval}'
     ORDER BY time ASC
     LIMIT 1000`,
    [machineId, tag]
  );
  return rows;
}

export async function getLatestReadings(
  machineId: number
): Promise<Partial<Record<ReadingTag, { value: number; time: string }>>> {
  const { rows } = await tsPool.query<{
    tag: ReadingTag;
    value: number;
    time: string;
  }>(
    `SELECT DISTINCT ON (tag) tag, value, time
     FROM machine_readings
     WHERE machine_id = $1
     ORDER BY tag, time DESC`,
    [machineId]
  );

  const result: Partial<Record<ReadingTag, { value: number; time: string }>> =
    {};
  for (const row of rows) {
    result[row.tag] = { value: row.value, time: row.time };
  }
  return result;
}
