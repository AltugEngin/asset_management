import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import type { Machine, UserRole } from "@repo/types";
import {
  CAN_CREATE_MACHINE,
  CAN_EDIT_MACHINE,
  CAN_DELETE_MACHINE,
} from "@repo/types";
import { MachineFormSheet } from "./MachineFormSheet";
import { MachineDeleteDialog } from "./MachineDeleteDialog";

const statusBadge: Record<string, string> = {
  aktif: "bg-green-100 text-green-800",
  pasif: "bg-red-100 text-red-800",
  bakımda: "bg-yellow-100 text-yellow-800",
};

const columnHelper = createColumnHelper<Machine>();

interface Props {
  data: Machine[];
  role: UserRole;
}

export function MachinesTable({ data, role }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>(undefined);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  const canCreate = CAN_CREATE_MACHINE.includes(role);
  const canEdit = CAN_EDIT_MACHINE.includes(role);
  const canDelete = CAN_DELETE_MACHINE.includes(role);

  const columns = useMemo(
    () => [
      columnHelper.accessor("code", {
        header: "Kod",
        cell: (info) => (
          <span className="font-mono font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Ad",
      }),
      columnHelper.accessor("status", {
        header: "Durum",
        cell: (info) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[info.getValue()] ?? ""}`}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("location", {
        header: "Konum",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("manufacturer", {
        header: "Üretici",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("model", {
        header: "Model",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          if (!canEdit && !canDelete) return null;
          return (
            <div className="flex items-center gap-1 justify-end">
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingMachine(row.original);
                    setSheetOpen(true);
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Düzenle
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeletingMachine(row.original)}
                  className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Sil
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [canEdit, canDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Ara (kod, ad, konum...)"
          className="w-full sm:w-72 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex items-center gap-2 shrink-0">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            onChange={(e) => {
              table.getColumn("status")?.setFilterValue(e.target.value || undefined);
            }}
          >
            <option value="">Tüm Durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
            <option value="bakımda">Bakımda</option>
          </select>

          {canCreate && (
            <button
              onClick={() => {
                setEditingMachine(undefined);
                setSheetOpen(true);
              }}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              + Yeni Makine
            </button>
          )}
        </div>
      </div>

      {/* Table — yatay kaydırma */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ↑"}
                    {header.column.getIsSorted() === "desc" && " ↓"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Makine bulunamadı
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          Toplam {table.getFilteredRowModel().rows.length} kayıt
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-accent transition-colors"
          >
            ‹ Önceki
          </button>
          <span>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Sonraki ›
          </button>
        </div>
      </div>

      {/* Modals */}
      <MachineFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        machine={editingMachine}
      />
      <MachineDeleteDialog
        machine={deletingMachine}
        onClose={() => setDeletingMachine(null)}
      />
    </>
  );
}
