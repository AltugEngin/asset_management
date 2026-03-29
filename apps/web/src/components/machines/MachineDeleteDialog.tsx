import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Machine } from "@repo/types";

interface Props {
  machine: Machine | null;
  onClose: () => void;
}

export function MachineDeleteDialog({ machine, onClose }: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/machines/${machine!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      onClose();
    },
  });

  if (!machine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold">Makineyi Sil</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{machine.code} – {machine.name}</span>{" "}
          makinesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>

        {deleteMutation.isError && (
          <p className="mt-2 text-sm text-destructive">Silme işlemi başarısız oldu.</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}
