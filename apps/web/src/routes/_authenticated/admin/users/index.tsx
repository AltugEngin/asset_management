import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { UserFormSheet } from "@/components/users/UserFormSheet";
import type { ApiResponse, User, UserRole } from "@repo/types";
import { CAN_VIEW_USERS } from "@repo/types";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  beforeLoad: () => {
    const stored = localStorage.getItem("user");
    if (!stored) throw redirect({ to: "/dashboard" });
    const user = JSON.parse(stored) as { group: { name: UserRole } };
    if (!CAN_VIEW_USERS.includes(user.group.name)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: UsersPage,
});

function UsersPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.group.name as UserRole;
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<ApiResponse<User[]>>("/users").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.patch(`/users/${id}/${isActive ? "deactivate" : "activate"}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const users = data?.success ? data.data : [];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kullanıcılar</h2>
          <p className="text-muted-foreground">Sistem kullanıcıları</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingUser(undefined); setSheetOpen(true); }}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + Yeni Kullanıcı
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Ad Soyad", "Kullanıcı Adı", "E-posta", "Grup", "Durum", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.group?.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditingUser(u); setSheetOpen(true); }}
                          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: u.id, isActive: u.isActive })
                          }
                          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          {u.isActive ? "Pasifleştir" : "Aktifleştir"}
                        </button>
                        {user?.id !== u.id && (
                          <button
                            onClick={() => {
                              if (confirm(`${u.username} silinsin mi?`)) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {!isAdmin && <td />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        user={editingUser}
      />
    </div>
  );
}
