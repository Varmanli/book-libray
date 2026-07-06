"use client";

export default function NoteScopeSelector({
  value,
  onChange,
  disabled = false,
  canChooseEdition = true,
}: {
  value: "book" | "edition";
  onChange: (value: "book" | "edition") => void;
  disabled?: boolean;
  canChooseEdition?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-foreground">این یادداشت درباره چیست؟</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("book")}
          className={
            value === "book"
              ? "rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary"
              : "rounded-2xl border border-border bg-background/45 px-4 py-3 text-sm font-medium text-foreground"
          }
        >
          خود کتاب
        </button>
        <button
          type="button"
          disabled={disabled || !canChooseEdition}
          onClick={() => onChange("edition")}
          className={
            value === "edition"
              ? "rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary disabled:opacity-50"
              : "rounded-2xl border border-border bg-background/45 px-4 py-3 text-sm font-medium text-foreground disabled:opacity-50"
          }
        >
          این نسخه / ترجمه
        </button>
      </div>
    </div>
  );
}
