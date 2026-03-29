import {
  createFileRoute,
  redirect,
  Outlet,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import type { ApiResponse, AuthPayload } from "@repo/types";
import { CAN_MANAGE_USERS, CAN_VIEW_USERS } from "@repo/types";
import type { UserRole } from "@repo/types";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const token = localStorage.getItem("token");
    if (!token) throw redirect({ to: "/login" });

    try {
      await api.get<ApiResponse<AuthPayload["user"]>>("/auth/me");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
      navigate({ to: "/login" });
    }
  };

  const role = user?.group.name as UserRole | undefined;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="px-4 py-5 border-b">
          <h1 className="font-bold text-base leading-tight">Varlık Yönetimi</h1>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{role}</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink to="/dashboard" label="Dashboard" />
          <NavLink to="/machines" label="Makineler" />
          {role && CAN_VIEW_USERS.includes(role) && (
            <NavLink to="/admin/users" label="Kullanıcılar" />
          )}
          {role && CAN_MANAGE_USERS.includes(role) && (
            <NavLink to="/admin/user-groups" label="Kullanıcı Grupları" />
          )}
        </nav>

        <div className="px-4 py-4 border-t">
          <p className="text-sm font-medium truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      activeProps={{ className: "block px-3 py-2 rounded-md text-sm font-medium bg-accent text-foreground" }}
    >
      {label}
    </Link>
  );
}
