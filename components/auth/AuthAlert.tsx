import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** پیام درون‌خطی و در دسترس (role=alert/status) برای خطا یا موفقیت فرم‌ها. */
export function AuthAlert({
  variant = "error",
  children,
}: {
  variant?: "error" | "success";
  children: React.ReactNode;
}) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        isError
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-primary/40 bg-primary/10 text-primary"
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="leading-6 text-foreground/90">{children}</span>
    </div>
  );
}
