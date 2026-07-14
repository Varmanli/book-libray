"use client";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommitSuccess } from "@/lib/importers/iranketab/commit-contract";

export default function IranKetabImportSuccess({ success, onRestart }: { success: CommitSuccess; onRestart: () => void }) {
  const count = (field: "action" | "coverAction", value: string) => success.result.editions.filter((item) => item[field] === value).length;
  return <Card data-testid="iranketab-import-success" className="border-emerald-500/35 bg-emerald-500/[0.04]">
    <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><CheckCircle2 />ثبت کتاب با موفقیت انجام شد</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <div><p className="text-xl font-black">{success.result.catalog.title}</p><p className="text-sm text-muted-foreground">تصمیم کاتالوگ: {success.result.catalog.action}</p></div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="نسخه ایجادشده" value={count("action", "CREATED")} /><Stat label="نسخه استفاده‌شده" value={count("action", "REUSED")} /><Stat label="نسخه به‌روزشده" value={count("action", "UPDATED")} /><Stat label="نسخه حذف‌شده" value={count("action", "EXCLUDED")} />
        <Stat label="کاور متصل" value={count("coverAction", "ATTACHED")} /><Stat label="کاور حفظ‌شده" value={count("coverAction", "KEPT")} /><Stat label="کاور ردشده" value={count("coverAction", "SKIPPED")} />
      </dl>
      {success.result.warnings.length ? <ul className="rounded-xl bg-amber-500/10 p-3 text-sm">{success.result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
      <div className="flex flex-wrap gap-2"><Button asChild><Link href={success.urls.public}>مشاهده کتاب</Link></Button><Button asChild variant="outline"><Link href={success.urls.admin}>ویرایش کتاب</Link></Button><Button asChild variant="outline"><Link href={success.urls.history}>مشاهده جزئیات ورود</Link></Button><Button type="button" variant="ghost" onClick={onRestart}>ورود کتاب دیگر</Button></div>
    </CardContent>
  </Card>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-background/60 p-3"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-black">{value.toLocaleString("fa-IR")}</dd></div>; }
