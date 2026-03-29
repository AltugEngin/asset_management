import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, User, UserGroup, CreateUserDto, UpdateUserDto } from "@repo/types";

const createSchema = z.object({
  username: z.string().min(3, "En az 3 karakter").max(50),
  email: z.string().email("Geçerli e-posta girin"),
  password: z.string().min(6, "En az 6 karakter"),
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  groupId: z.coerce.number().int().positive("Grup seçin"),
});

const updateSchema = createSchema
  .omit({ password: true, username: true })
  .extend({ password: z.string().min(6).optional().or(z.literal("")) });

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  user?: User;
}

export function UserFormSheet({ open, onClose, user }: Props) {
  const queryClient = useQueryClient();

  const { data: groupsRes } = useQuery({
    queryKey: ["user-groups"],
    queryFn: () =>
      api.get<ApiResponse<UserGroup[]>>("/user-groups").then((r) => r.data),
    enabled: open,
  });
  const groups = groupsRes?.success ? groupsRes.data : [];

  const schema = user ? updateSchema : createSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm | UpdateForm>({
    resolver: zodResolver(schema),
    defaultValues: user
      ? {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          groupId: user.groupId,
          password: "",
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) =>
      api.post<ApiResponse<User>>("/users", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) =>
      api.put<ApiResponse<User>>(`/users/${user!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  const onSubmit = (data: CreateForm | UpdateForm) => {
    if (user) {
      const { password, ...rest } = data as UpdateForm;
      const payload: UpdateUserDto = { ...rest };
      if (password) payload.password = password;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(data as CreateUserDto);
    }
  };

  const mutError = createMutation.error || updateMutation.error;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l shadow-xl flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {user ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!user && (
            <Field label="Kullanıcı Adı *" error={(errors as Record<string, { message?: string }>).username?.message}>
              <input {...register("username")} className={inputCls} placeholder="ornek.kullanici" />
            </Field>
          )}

          <Field label="Ad *" error={errors.firstName?.message}>
            <input {...register("firstName")} className={inputCls} />
          </Field>

          <Field label="Soyad *" error={errors.lastName?.message}>
            <input {...register("lastName")} className={inputCls} />
          </Field>

          <Field label="E-posta *" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputCls} />
          </Field>

          <Field label={user ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre *"} error={errors.password?.message}>
            <input {...register("password")} type="password" className={inputCls} />
          </Field>

          <Field label="Grup *" error={errors.groupId?.message}>
            <select {...register("groupId")} className={inputCls}>
              <option value="">Grup seçin</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>

          {mutError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              Bir hata oluştu
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {user ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
