import { Info } from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * Shared frame for admin sections whose backend model isn't built yet. Renders a
 * clear "coming next phase" notice plus any scaffolded preview content, so the
 * navigation and UX boundary exist without faking persistence.
 */
export default function AdminScaffold({
  title,
  description,
  notice,
  children,
}: {
  title: string;
  description?: string;
  notice: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-7 text-muted-foreground">{notice}</p>
      </div>

      {children}
    </div>
  );
}
