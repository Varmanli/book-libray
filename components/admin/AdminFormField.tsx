import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AdminFormField({
  label,
  error,
  required = false,
  htmlFor,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-sm font-bold text-foreground"
      >
        {label}
        {required ? <span className="mr-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
