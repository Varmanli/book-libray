"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type Kind = "book" | "author" | "genre";
type Result = { id: string; label: string; detail: string | null };

function Picker({ kind, title, value, onChange }: { kind: Kind; title: string; value: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState(""); const [results, setResults] = useState<Result[]>([]); const [loading, setLoading] = useState(false);
  useEffect(() => { const q = query.trim(); if (!q) { setResults([]); return; } const timer = setTimeout(() => { setLoading(true); fetch(`/api/admin/blog/entities?type=${kind}&q=${encodeURIComponent(q)}`, { credentials: "include" }).then((r) => r.json()).then((data: { results?: Result[] }) => setResults(data.results ?? [])).catch(() => setResults([])).finally(() => setLoading(false)); }, 250); return () => clearTimeout(timer); }, [kind, query]);
  return <div><p className="mb-2 text-sm font-black text-foreground">{title}</p><div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pr-9" placeholder={`جستجوی ${title}...`} /></div>{value.length ? <div className="mt-2 flex flex-wrap gap-2">{value.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">انتخاب‌شده<button type="button" onClick={() => onChange(value.filter((item) => item !== id))} aria-label="حذف"><X className="h-3.5 w-3.5" /></button></span>)}</div> : null}<div className="mt-2 space-y-1">{loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}{results.filter((result) => !value.includes(result.id)).map((result) => <button key={result.id} type="button" onClick={() => { onChange([...value, result.id]); setQuery(""); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-right text-sm hover:bg-muted"><span>{result.label}</span>{result.detail ? <span className="text-xs text-muted-foreground">{result.detail}</span> : null}</button>)}</div></div>;
}

export default function BlogEntityRelations({ bookIds, authorIds, genreIds, onChange }: { bookIds: string[]; authorIds: string[]; genreIds: string[]; onChange: (field: "relatedBookIds" | "relatedAuthorIds" | "relatedGenreIds", ids: string[]) => void }) {
  return <div className="space-y-5"><Picker kind="book" title="کتاب‌های مرتبط" value={bookIds} onChange={(ids) => onChange("relatedBookIds", ids)} /><Picker kind="author" title="نویسنده‌های مرتبط" value={authorIds} onChange={(ids) => onChange("relatedAuthorIds", ids)} /><Picker kind="genre" title="ژانرها و موضوعات مرتبط" value={genreIds} onChange={(ids) => onChange("relatedGenreIds", ids)} /></div>;
}
