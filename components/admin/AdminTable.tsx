import { Loader2 } from "lucide-react";

/**
 * Lightweight responsive table shell with built-in loading/empty states.
 * Columns + rows are passed as plain nodes so each page controls its own cells.
 */
export default function AdminTable({
  columns,
  children,
  loading,
  isEmpty,
  emptyText = "موردی یافت نشد",
  colSpan,
}: {
  columns: string[];
  children: React.ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  colSpan?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td
                colSpan={colSpan ?? columns.length}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td
                colSpan={colSpan ?? columns.length}
                className="px-4 py-12 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
