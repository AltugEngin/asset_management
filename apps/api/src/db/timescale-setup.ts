import { tsPool } from "./timescale";

export async function setupTimescale(): Promise<void> {
  const client = await tsPool.connect();
  try {
    // Tabloyu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS machine_readings (
        time        TIMESTAMPTZ      NOT NULL,
        machine_id  INTEGER          NOT NULL,
        tag         TEXT             NOT NULL,
        value       DOUBLE PRECISION NOT NULL
      );
    `);

    // Hypertable'a dönüştür (zaten varsa hata verme)
    await client.query(`
      SELECT create_hypertable(
        'machine_readings', 'time',
        if_not_exists => TRUE
      );
    `);

    // Sorgu performansı için indeks
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_readings_machine_tag
        ON machine_readings (machine_id, tag, time DESC);
    `);

    console.log("TimescaleDB hazır.");
  } finally {
    client.release();
  }
}
