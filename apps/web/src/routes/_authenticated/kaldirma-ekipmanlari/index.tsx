import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { ApiResponse, EquipmentRequest, UserRole } from "@repo/types";
import { CAN_REVIEW_EQUIPMENT_REQUESTS } from "@repo/types";

export const Route = createFileRoute("/_authenticated/kaldirma-ekipmanlari/")({
  component: LiftingEquipmentRequestsPage,
});

const statusBadge: Record<string, string> = {
  beklemede: "bg-yellow-100 text-yellow-800",
  onaylandı: "bg-green-100 text-green-800",
  reddedildi: "bg-red-100 text-red-800",
};

const groupLabel: Record<string, string> = {
  manlift: "Manlift",
  "vinç": "Vinç",
  sepet: "Sepet",
};

function LiftingEquipmentRequestsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.group.name as UserRole;
  const isAdmin = CAN_REVIEW_EQUIPMENT_REQUESTS.includes(role);
  const queryClient = useQueryClient();

  // Admin tüm talepleri, mühendis sadece kendi taleplerini görür
  const endpoint = isAdmin ? "/equipment-requests" : "/equipment-requests/my";

  const { data, isLoading } = useQuery({
    queryKey: ["equipment-requests", isAdmin ? "all" : "my"],
    queryFn: () =>
      api.get<ApiResponse<EquipmentRequest[]>>(endpoint).then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "onaylandı" | "reddedildi" }) =>
      api.patch(`/equipment-requests/${id}/review`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["equipment-requests"] }),
  });

  const requests = data?.success ? data.data : [];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Kaldırma Ekipmanı Talepleri</h2>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Tüm kaldırma ekipmanı talepleri"
            : "Kaldırma ekipmanı talepleriniz"}
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          Henüz talep bulunmuyor.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {[
                  "Ekipman",
                  "Grup",
                  "Makine",
                  "Açıklama",
                  ...(isAdmin ? ["Talep Eden"] : []),
                  "Durum",
                  "Talep Tarihi",
                  ...(isAdmin ? ["Onaylayan", ""] : []),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.equipment?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {req.equipment?.code}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {req.equipment?.group ? groupLabel[req.equipment.group] : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {req.machine ? (
                      <>
                        <div className="font-medium">{req.machine.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{req.machine.code}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm text-muted-foreground line-clamp-2">{req.reason}</p>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">
                        {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {req.requestedBy?.username}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusBadge[req.status] ?? ""
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  {isAdmin && (
                    <>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {req.reviewedBy
                          ? `${req.reviewedBy.firstName} ${req.reviewedBy.lastName}`
                          : "—"}
                        {req.reviewedAt && (
                          <div className="text-xs">
                            {new Date(req.reviewedAt).toLocaleDateString("tr-TR")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "beklemede" && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() =>
                                reviewMutation.mutate({ id: req.id, status: "onaylandı" })
                              }
                              disabled={reviewMutation.isPending}
                              className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() =>
                                reviewMutation.mutate({ id: req.id, status: "reddedildi" })
                              }
                              disabled={reviewMutation.isPending}
                              className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
