import {
  createFileRoute,
  redirect,
  Outlet,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import type { ApiResponse, AuthPayload } from "@repo/types";
import { CAN_MANAGE_USERS, CAN_VIEW_USERS, CAN_VIEW_EQUIPMENT_REQUESTS } from "@repo/types";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
      navigate({ to: "/login" });
    }
  };

  const role = user?.group.name as UserRole | undefined;

  const navContent = (
    <>
      <div className="px-4 py-5 border-b">
        <h1 className="font-bold text-base leading-tight">Varlık Yönetimi</h1>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{role}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavLink to="/dashboard" label="Dashboard" onClick={() => setSidebarOpen(false)} />
        <NavLink to="/machines" label="Makineler" onClick={() => setSidebarOpen(false)} />
        {role && CAN_VIEW_EQUIPMENT_REQUESTS.includes(role) && (
          <NavLink to="/kaldirma-ekipmanlari" label="Kaldırma Ekipmanları" onClick={() => setSidebarOpen(false)} />
        )}
        {role && CAN_VIEW_USERS.includes(role) && (
          <NavLink to="/admin/users" label="Kullanıcılar" onClick={() => setSidebarOpen(false)} />
        )}
        {role && CAN_MANAGE_USERS.includes(role) && (
          <NavLink to="/admin/user-groups" label="Kullanıcı Grupları" onClick={() => setSidebarOpen(false)} />
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
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r bg-card flex-col shrink-0">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transform transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Menüyü aç"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-sm">Varlık Yönetimi</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      activeProps={{
        className:
          "block px-3 py-2 rounded-md text-sm font-medium bg-accent text-foreground",
      }}
    >
      {label}
    </Link>
  );
}
