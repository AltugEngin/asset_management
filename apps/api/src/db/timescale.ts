import { Pool } from "pg";

export const tsPool = new Pool({
  connectionString: process.env.TIMESCALE_URL,
});
