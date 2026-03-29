import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, UserGroup, UserRole } from "@repo/types";
import { CAN_MANAGE_USERS } from "@repo/types";

export const Route = createFileRoute("/_authenticated/admin/user-groups/")({
  beforeLoad: () => {
    const stored = localStorage.getItem("user");
    if (!stored) throw redirect({ to: "/dashboard" });
    const user = JSON.parse(stored) as { group: { name: UserRole } };
    if (!CAN_MANAGE_USERS.includes(user.group.name)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: UserGroupsPage,
});

function UserGroupsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-groups"],
    queryFn: () =>
      api.get<ApiResponse<UserGroup[]>>("/user-groups").then((r) => r.data),
  });

  const groups = data?.success ? data.data : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Kullanıcı Grupları</h2>
        <p className="text-muted-foreground">Sistemdeki rol grupları</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["#", "Grup Adı", "Açıklama"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{g.id}</td>
                  <td className="px-4 py-3 font-medium capitalize">{g.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
