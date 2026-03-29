import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { ApiResponse, Machine, User } from "@repo/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.group.name;

  const { data: machinesRes } = useQuery({
    queryKey: ["machines"],
    queryFn: () => api.get<ApiResponse<Machine[]>>("/machines").then((r) => r.data),
  });

  const { data: usersRes } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<ApiResponse<User[]>>("/users").then((r) => r.data),
    enabled: ["admin", "direktör", "müdür"].includes(role ?? ""),
  });

  const machines = machinesRes?.success ? machinesRes.data : [];
  const users = usersRes?.success ? usersRes.data : [];

  const statusCount = machines.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Hoşgeldiniz, {user?.firstName} {user?.lastName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam Makine" value={machines.length} />
        <StatCard
          label="Aktif"
          value={statusCount["aktif"] ?? 0}
          className="border-green-200"
        />
        <StatCard
          label="Bakımda"
          value={statusCount["bakımda"] ?? 0}
          className="border-yellow-200"
        />
        <StatCard
          label="Pasif"
          value={statusCount["pasif"] ?? 0}
          className="border-red-200"
        />
        {["admin", "direktör", "müdür"].includes(role ?? "") && (
          <StatCard label="Toplam Kullanıcı" value={users.length} />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 shadow-sm ${className}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
