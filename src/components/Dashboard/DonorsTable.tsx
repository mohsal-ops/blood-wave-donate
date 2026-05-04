import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { differenceInDays, differenceInYears, format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
} from "lucide-react";
import type { Donor } from "@/lib/constants";
import { BLOOD_TYPE_COLORS, ELIGIBILITY_DAYS } from "@/lib/constants";
import { useDeleteDonor } from "@/hooks/useDonors";
import DonorDetailsModal from "./DonorDetailsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "../ui/sonner";

interface DonorsTableProps {
  donors: Donor[];
  allDonors?: Donor[];
}

const DonorsTable = ({ donors, allDonors }: DonorsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Donor | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const deleteMutation = useDeleteDonor();

  const today = new Date();

  const getEligibility = (donor: Donor) => {
    if (!donor.is_active) return { eligible: false, days: 0, label: "غير نشط" };
    if (!donor.last_donation_date)
      return { eligible: true, days: 0, label: "مؤهل (لم يتبرع)" };
    const days = differenceInDays(today, new Date(donor.last_donation_date));
    if (days >= ELIGIBILITY_DAYS)
      return { eligible: true, days: 0, label: "مؤهل ✅" };
    return {
      eligible: false,
      days: ELIGIBILITY_DAYS - days,
      label: `غير مؤهل - ${ELIGIBILITY_DAYS - days} يوم`,
    };
  };

  const columns = useMemo<ColumnDef<Donor>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="accent-blue-600"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-blue-600"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "full_name",
        header: "الاسم",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "blood_type",
        header: "الفصيلة",
        cell: ({ getValue }) => {
          const type = getValue<string>();
          const colors = BLOOD_TYPE_COLORS[type] || {
            bg: "bg-gray-500/20",
            text: "text-gray-400",
            border: "border-gray-500/50",
          };
          return (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: "phone_whatsapp",
        header: "الهاتف",
        cell: ({ getValue }) => (
          <span className="text-slate-600 dark:text-slate-300 text-sm">{getValue<string>()}</span>
        ),
      },
      {
        id: "location",
        header: "الموقع",
        accessorFn: (row) =>
          [row.municipality, row.wilaya].filter(Boolean).join("، "),
        cell: ({ getValue }) => (
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {getValue<string>() || "—"}
          </span>
        ),
      },
      {
        id: "date_of_birth",
        header: "تاريخ الميلاد",
        accessorFn: (row) => row.date_of_birth,
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <span className="text-slate-400 text-sm">—</span>;
          const age = differenceInYears(today, new Date(val));
          return (
            <span className="text-slate-600 dark:text-slate-300 text-sm">
              {format(new Date(val), "dd/MM/yyyy", { locale: ar })}
              <span className="text-slate-400 text-xs mr-1">({age} سنة)</span>
            </span>
          );
        },
      },
      {
        accessorKey: "has_chronic_disease",
        header: "أمراض مزمنة/معدية",
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val || val === "لا") {
            return (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                لا
              </span>
            );
          }
          return (
            <span
              className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 max-w-[200px] truncate inline-block"
              title={val}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "last_donation_date",
        header: "آخر تبرع",
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          return (
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              {val ? format(new Date(val), "dd/MM/yyyy", { locale: ar }) : "—"}
            </span>
          );
        },
      },
      {
        id: "eligibility",
        header: "الأهلية",
        accessorFn: (row) => getEligibility(row),
        cell: ({ row }) => {
          const e = getEligibility(row.original);
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${e.eligible ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
            >
              {e.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const d = row.original;
          const formatPhone = (phone: string) => {
            let p = phone.replace(/[^0-9]/g, "");
            if (p.startsWith("0")) p = "213" + p.slice(1);
            else if (!p.startsWith("213")) p = "213" + p;
            return p;
          };
          const formattedPhone = formatPhone(d.phone_whatsapp);

          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => (window.location.href = `tel:+${formattedPhone}`)}
                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                title="اتصال"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  window.open(`https://wa.me/${formattedPhone}`, "_blank", "noopener,noreferrer")
                }
                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                title="واتساب"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedDonor(d);
                  setDetailsOpen(true);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                title="عرض"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(d)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: donors,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("تم حذف المتبرع بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
    setDeleteTarget(null);
  };

  const buildAndDownloadCSV = (rows: Donor[], suffix = "") => {
    const BOM = "\uFEFF";
    const headers = ["الاسم", "الفصيلة", "الهاتف", "الولاية", "البلدية", "تاريخ الميلاد", "أمراض مزمنة/معدية", "آخر تبرع", "الحالة"];
    const dataRows = rows.map((d) => [
      d.full_name,
      d.blood_type,
      d.phone_whatsapp,
      d.wilaya || "",
      d.municipality || "",
      d.date_of_birth || "",
      d.has_chronic_disease || "",
      d.last_donation_date || "",
      getEligibility(d).label,
    ]);
    const csv = BOM + [headers, ...dataRows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donors${suffix}_${format(today, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSelectedOrFiltered = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      buildAndDownloadCSV(selectedRows.map((r) => r.original), "_selected");
      toast.success(`تم تصدير ${selectedRows.length} متبرع`);
    } else {
      buildAndDownloadCSV(donors, "_filtered");
      toast.success(`تم تصدير ${donors.length} متبرع`);
    }
  };

  const exportAll = () => {
    const all = allDonors ?? donors;
    buildAndDownloadCSV(all, "_all");
    toast.success(`تم تصدير جميع المتبرعين (${all.length})`);
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-800">
          <span className="text-sm text-slate-700 dark:text-slate-300">{selectedCount} محدد</span>
          <button
            onClick={exportSelectedOrFiltered}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <Download className="w-4 h-4" /> تصدير المحدد
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-right" dir="rtl">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-slate-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ChevronUp className="w-3 h-3" />}
                      {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>المعروض: {donors.length}</span>
          {allDonors && allDonors.length !== donors.length && (
            <span className="text-slate-400">/ الإجمالي: {allDonors.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            السابق
          </button>
          <span className="text-sm text-slate-500">
            {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            التالي
          </button>
        </div>
        <button
          onClick={exportAll}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          <Download className="w-4 h-4" /> تصدير الكل ({(allDonors ?? donors).length})
        </button>
      </div>

      <DonorDetailsModal
        donor={selectedDonor}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              هل أنت متأكد من حذف المتبرع "{deleteTarget?.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DonorsTable;
