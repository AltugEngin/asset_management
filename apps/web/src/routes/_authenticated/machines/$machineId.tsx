import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import type {
  ApiResponse,
  Machine,
  MachineReading,
  LatestReadings,
  ReadingTag,
} from "@repo/types";
import { READING_TAGS, TAG_LABELS } from "@repo/types";

export const Route = createFileRoute("/_authenticated/machines/$machineId")({
  component: MachineDetailPage,
});

type RangeOption = "15m" | "1h" | "6h" | "24h" | "7d";

const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: "15m", label: "15 dk" },
  { value: "1h", label: "1 saat" },
  { value: "6h", label: "6 saat" },
  { value: "24h", label: "24 saat" },
  { value: "7d", label: "7 gün" },
];

const STATUS_COLORS: Record<string, string> = {
  aktif: "bg-green-100 text-green-800",
  pasif: "bg-red-100 text-red-800",
  bakımda: "bg-yellow-100 text-yellow-800",
};

function formatTime(isoString: string, range: RangeOption): string {
  const d = new Date(isoString);
  if (range === "7d")
    return d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
  if (range === "24h" || range === "6h")
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function MachineDetailPage() {
  const { machineId } = Route.useParams();
  const id = parseInt(machineId, 10);
  const [range, setRange] = useState<RangeOption>("1h");
  const [activeTag, setActiveTag] = useState<ReadingTag>("güç");

  const { data: machineData } = useQuery({
    queryKey: ["machine", id],
    queryFn: () =>
      api
        .get<ApiResponse<Machine>>(`/machines/${id}`)
        .then((r) => r.data),
  });

  const { data: latestData } = useQuery({
    queryKey: ["readings", id, "latest"],
    queryFn: () =>
      api
        .get<ApiResponse<LatestReadings>>(`/readings/${id}/latest`)
        .then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: chartData, isFetching } = useQuery({
    queryKey: ["readings", id, activeTag, range],
    queryFn: () =>
      api
        .get<ApiResponse<MachineReading[]>>(
          `/readings/${id}?tag=${encodeURIComponent(activeTag)}&range=${range}`
        )
        .then((r) => r.data),
    refetchInterval: 5000,
  });

  const machine = machineData?.success ? machineData.data : null;
  const latest = latestData?.success ? latestData.data : null;
  const readings = chartData?.success ? chartData.data : [];

  const chartPoints = readings.map((r) => ({
    time: formatTime(r.time, range),
    value: r.value,
  }));

  const tagInfo = TAG_LABELS[activeTag];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Geri butonu + başlık */}
      <div>
        <Link
          to="/machines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Makineler
        </Link>

        {machine && (
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{machine.code}</h2>
            <span className="text-muted-foreground">{machine.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[machine.status] ?? "bg-gray-100"}`}
            >
              {machine.status}
            </span>
            {machine.location && (
              <span className="text-xs text-muted-foreground">
                {machine.location}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Anlık değer kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {READING_TAGS.map((tag) => {
          const info = TAG_LABELS[tag];
          const entry = latest?.[tag];
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "hover:bg-muted/50"
              }`}
            >
              <p className="text-xs text-muted-foreground">{info.label}</p>
              <p
                className="text-2xl font-bold mt-1 tabular-nums"
                style={{ color: info.color }}
              >
                {entry != null
                  ? tag === "üretim"
                    ? Math.floor(entry.value).toLocaleString("tr-TR")
                    : entry.value.toFixed(1)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {info.unit}
              </p>
            </button>
          );
        })}
      </div>

      {/* Grafik */}
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold">
            {tagInfo.label}{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({tagInfo.unit})
            </span>
            {isFetching && (
              <span className="ml-2 text-xs text-muted-foreground">
                güncelleniyor...
              </span>
            )}
          </h3>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  range === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {chartPoints.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Henüz veri yok — OPC UA server'dan veri bekleniyor...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartPoints}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} width={60} />
              <Tooltip
                formatter={(value: number) => [
                  `${
                    activeTag === "üretim"
                      ? Math.floor(value).toLocaleString("tr-TR")
                      : value.toFixed(2)
                  } ${tagInfo.unit}`,
                  tagInfo.label,
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={tagInfo.color}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
