export type Tag = "güç" | "tüketim" | "sıcaklık" | "vibrasyon" | "üretim";

export const TAGS: Tag[] = [
  "güç",
  "tüketim",
  "sıcaklık",
  "vibrasyon",
  "üretim",
];

export interface MachineState {
  id: number;
  code: string;
  güç: number;
  güçBase: number;
  tüketim: number;
  sıcaklık: number;
  sıcaklıkBase: number;
  vibrasyon: number;
  vibrasyonBase: number;
  üretim: number;
}

export function createInitialState(id: number, code: string): MachineState {
  const güçBase = 100 + Math.random() * 400; // 100–500 kW
  const sıcaklıkBase = 40 + Math.random() * 80; // 40–120 °C
  const vibrasyonBase = 1 + Math.random() * 9; // 1–10 mm/s

  return {
    id,
    code,
    güç: güçBase,
    güçBase,
    tüketim: güçBase * 0.18,
    sıcaklık: sıcaklıkBase,
    sıcaklıkBase,
    vibrasyon: vibrasyonBase,
    vibrasyonBase,
    üretim: Math.floor(Math.random() * 1000),
  };
}

/** State'i yerinde günceller (mutable) */
export function tick(s: MachineState): void {
  // Güç: güçBase'e ortalama dönen rastgele yürüyüş
  const güçNoise = (Math.random() - 0.5) * 20;
  s.güç = Math.max(0, s.güç * 0.95 + s.güçBase * 0.05 + güçNoise);

  // Tüketim: güç ile korele
  s.tüketim = Math.max(0, s.güç * 0.18 + (Math.random() - 0.5) * 2);

  // Sıcaklık: yavaş ortalama dönüşü
  s.sıcaklık =
    s.sıcaklık * 0.99 +
    s.sıcaklıkBase * 0.01 +
    (Math.random() - 0.5) * 0.5;

  // Vibrasyon: gürültülü, %2 ihtimalle ani artış
  s.vibrasyon = s.vibrasyonBase * (0.8 + Math.random() * 0.4);
  if (Math.random() < 0.02) s.vibrasyon *= 2.5;

  // Üretim: %30 ihtimalle +1 artış
  if (Math.random() < 0.3) s.üretim += 1;
}
