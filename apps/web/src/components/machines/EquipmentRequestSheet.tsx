import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, LiftingEquipment, Machine } from "@repo/types";

const schema = z.object({
  equipmentId: z.number({ required_error: "Ekipman seçiniz" }).int().positive("Ekipman seçiniz"),
  machineId: z.number().int().positive().optional(),
  reason: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
});

type FormValues = z.infer<typeof schema>;

const groupLabels: Record<string, string> = {
  manlift: "Manlift",
  "vinç": "Vinç",
  sepet: "Sepet",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EquipmentRequestSheet({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: equipmentData } = useQuery({
    queryKey: ["lifting-equipment"],
    queryFn: () =>
      api.get<ApiResponse<LiftingEquipment[]>>("/lifting-equipment").then((r) => r.data),
    enabled: open,
  });

  const { data: machinesData } = useQuery({
    queryKey: ["machines"],
    queryFn: () =>
      api.get<ApiResponse<Machine[]>>("/machines").then((r) => r.data),
    enabled: open,
  });

  const equipmentList = equipmentData?.success ? equipmentData.data : [];
  const machinesList = machinesData?.success ? machinesData.data : [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post<ApiResponse<unknown>>("/equipment-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-requests"] });
      onClose();
    },
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  if (!open) return null;

  // Ekipmanları gruba göre grupla
  const grouped = equipmentList.reduce<Record<string, LiftingEquipment[]>>(
    (acc, eq) => {
      if (!acc[eq.group]) acc[eq.group] = [];
      acc[eq.group].push(eq);
      return acc;
    },
    {}
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Kaldırma Ekipmanı Talep Et</h2>
            <p className="text-sm text-muted-foreground">Onay için admin'e gönderilecektir</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Ekipman Seç */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Ekipman <span className="text-destructive">*</span>
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              defaultValue=""
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setValue("equipmentId", val, { shouldValidate: true });
              }}
            >
              <option value="" disabled>Ekipman seçiniz...</option>
              {Object.entries(grouped).map(([group, items]) => (
                <optgroup key={group} label={groupLabels[group] ?? group}>
                  {items.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code} — {eq.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.equipmentId && (
              <p className="text-xs text-destructive">{errors.equipmentId.message}</p>
            )}
          </div>

          {/* Makine Seç */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Hangi Makine İçin?
              <span className="ml-1 text-xs text-muted-foreground font-normal">(isteğe bağlı)</span>
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              defaultValue=""
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  setValue("machineId", val, { shouldValidate: true });
                } else {
                  setValue("machineId", undefined);
                }
              }}
            >
              <option value="">Makine seçiniz (isteğe bağlı)...</option>
              {machinesList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Açıklama / Neden */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Kaldırma Ekipmanı Neden Gerekli? <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register("reason")}
              rows={5}
              placeholder="Ekipmanı hangi iş için, nerede ve ne zaman kullanacağınızı açıklayınız..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              Talep gönderilemedi. Lütfen tekrar deneyin.
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "Gönderiliyor..." : "Onaya Gönder"}
          </button>
        </div>
      </div>
    </>
  );
}
