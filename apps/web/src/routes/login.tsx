import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { ApiResponse, AuthPayload } from "@repo/types";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const token = localStorage.getItem("token");
    if (token) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const res = await api.post<ApiResponse<AuthPayload>>("/auth/login", data);
      if (res.data.success) {
        setAuth(res.data.data.token, res.data.data.user);
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<never> } };
      const msg = axiosErr.response?.data?.success === false
        ? axiosErr.response.data.error
        : "Giriş yapılırken bir hata oluştu";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-lg border shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Varlık Yönetimi</h1>
            <p className="text-sm text-muted-foreground mt-1">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="username">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                {...register("username")}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoComplete="username"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
