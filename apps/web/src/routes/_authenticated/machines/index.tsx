import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { MachinesTable } from "@/components/machines/MachinesTable";
import type { ApiResponse, Machine, UserRole } from "@repo/types";

export const Route = createFileRoute("/_authenticated/machines/")({
  component: MachinesPage,
});

function MachinesPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.group.name as UserRole;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["machines"],
    queryFn: () =>
      api.get<ApiResponse<Machine[]>>("/machines").then((r) => r.data),
  });

  const machines = data?.success ? data.data : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Makineler</h2>
        <p className="text-muted-foreground">Üretim tesisindeki tüm makineler</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Yükleniyor...
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-destructive">
          Makineler yüklenirken hata oluştu.
        </div>
      )}

      {!isLoading && !isError && (
        <MachinesTable data={machines} role={role} />
      )}
    </div>
  );
}
