import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, Machine, CreateMachineDto, UpdateMachineDto } from "@repo/types";

const machineSchema = z.object({
  code: z.string().min(1, "Kod gerekli").max(50),
  name: z.string().min(1, "Ad gerekli").max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["aktif", "pasif", "bakımda"]).default("aktif"),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
});

type MachineForm = z.infer<typeof machineSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  machine?: Machine;
}

export function MachineFormSheet({ open, onClose, machine }: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MachineForm>({
    resolver: zodResolver(machineSchema),
    defaultValues: machine
      ? {
          code: machine.code,
          name: machine.name,
          description: machine.description ?? "",
          location: machine.location ?? "",
          status: machine.status,
          manufacturer: machine.manufacturer ?? "",
          model: machine.model ?? "",
          serialNumber: machine.serialNumber ?? "",
        }
      : { status: "aktif" },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMachineDto) =>
      api.post<ApiResponse<Machine>>("/machines", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      reset();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMachineDto) =>
      api.put<ApiResponse<Machine>>(`/machines/${machine!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      onClose();
    },
  });

  const onSubmit = (data: MachineForm) => {
    if (machine) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const error = createMutation.error || updateMutation.error;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="w-full max-w-md bg-card border-l shadow-xl flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {machine ? "Makineyi Düzenle" : "Yeni Makine"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <Field label="Kod *" error={errors.code?.message}>
            <input {...register("code")} className={inputCls} placeholder="KOM.3060" />
          </Field>

          <Field label="Ad *" error={errors.name?.message}>
            <input {...register("name")} className={inputCls} placeholder="Makine adı" />
          </Field>

          <Field label="Durum">
            <select {...register("status")} className={inputCls}>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
              <option value="bakımda">Bakımda</option>
            </select>
          </Field>

          <Field label="Konum">
            <input {...register("location")} className={inputCls} placeholder="Üretim Sahası A" />
          </Field>

          <Field label="Üretici">
            <input {...register("manufacturer")} className={inputCls} placeholder="Atlas Copco" />
          </Field>

          <Field label="Model">
            <input {...register("model")} className={inputCls} />
          </Field>

          <Field label="Seri No">
            <input {...register("serialNumber")} className={inputCls} />
          </Field>

          <Field label="Açıklama">
            <textarea {...register("description")} className={inputCls} rows={3} />
          </Field>

          {error && (
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
              {machine ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
