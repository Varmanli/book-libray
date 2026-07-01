"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, BookCopy, Check, Loader2, Tags, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  AdminActionButton,
  AdminBadge,
  AdminDataTableToolbar,
} from "@/components/admin/AdminDataTable";
import {
  APPROVAL_STATUS_LABELS,
  REFERENCE_TYPE_LABELS,
  type ReferenceTypeValue,
} from "@/lib/validations/reference";

interface PendingBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  createdByName: string | null;
  createdAt: string;
}
interface PendingRef {
  id: string;
  name: string;
  type: ReferenceTypeValue;
  createdAt: string;
}

export default function AdminApprovalsPage() {
  const [books, setBooks] = useState<PendingBook[]>([]);
  const [refs, setRefs] = useState<PendingRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([
        fetch("/api/admin/books?status=PENDING&page=1", { credentials: "include" }),
        fetch("/api/admin/reference?status=PENDING", { credentials: "include" }),
      ]);
      const bd = await b.json();
      const rd = await r.json();
      if (b.ok) setBooks(bd.books || []);
      if (r.ok) setRefs(rd.items || []);
    } catch {
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decideBook = async (id: string, status: "APPROVED" | "REJECTED") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("عملیات ناموفق بود");
        return;
      }
      toast.success(status === "APPROVED" ? "تأیید شد" : "رد شد");
      setBooks((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  };

  const decideRef = async (id: string, status: "APPROVED" | "REJECTED") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reference/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("عملیات ناموفق بود");
        return;
      }
      toast.success(status === "APPROVED" ? "تأیید شد" : "رد شد");
      setRefs((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  };

  const totalPending = books.length + refs.length;

  return (
    <div>
      <AdminDataTableToolbar
        title="تایید اطلاعات جدید"
        subtitle={`${totalPending.toLocaleString("fa-IR")} مورد در انتظار تأیید`}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : totalPending === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <BadgeCheck className="h-10 w-10 text-primary" />
          <p className="mt-3 text-sm font-bold text-foreground">صف تأیید خالی است</p>
          <p className="mt-1 text-xs text-muted-foreground">
            موردی برای بررسی وجود ندارد.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {books.length > 0 ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <BookCopy className="h-4 w-4 text-muted-foreground" />
                کتاب‌های کاتالوگ ({books.length.toLocaleString("fa-IR")})
              </h2>
              <ul className="space-y-2">
                {books.map((b) => (
                  <ApprovalRow
                    key={b.id}
                    title={b.title}
                    subtitle={`${b.author}${b.genre ? ` · ${b.genre}` : ""}`}
                    meta={b.createdByName ? `توسط ${b.createdByName}` : undefined}
                    typeLabel="کتاب کاتالوگ"
                    busy={busy === b.id}
                    onApprove={() => decideBook(b.id, "APPROVED")}
                    onReject={() => decideBook(b.id, "REJECTED")}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {refs.length > 0 ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Tags className="h-4 w-4 text-muted-foreground" />
                فهرست‌های مرجع ({refs.length.toLocaleString("fa-IR")})
              </h2>
              <ul className="space-y-2">
                {refs.map((r) => (
                  <ApprovalRow
                    key={r.id}
                    title={r.name}
                    typeLabel={REFERENCE_TYPE_LABELS[r.type]}
                    busy={busy === r.id}
                    onApprove={() => decideRef(r.id, "APPROVED")}
                    onReject={() => decideRef(r.id, "REJECTED")}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ApprovalRow({
  title,
  subtitle,
  meta,
  typeLabel,
  busy,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  typeLabel: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/55 px-4 py-3 backdrop-blur-md transition-colors hover:border-border">
      <AdminBadge>{typeLabel}</AdminBadge>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      <AdminBadge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
        {APPROVAL_STATUS_LABELS.PENDING}
      </AdminBadge>
      <div className="flex items-center gap-1">
        <AdminActionButton
          icon={
            busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )
          }
          tone="primary"
          onClick={onApprove}
          disabled={busy}
          title="تأیید"
        />
        <AdminActionButton
          icon={<X className="h-4 w-4" />}
          tone="danger"
          onClick={onReject}
          disabled={busy}
          title="رد"
        />
      </div>
    </li>
  );
}
