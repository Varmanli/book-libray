import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input/70 placeholder:text-muted-foreground/60 hover:border-border focus-visible:border-primary/60 focus-visible:ring-primary/25 aria-invalid:ring-destructive/20 aria-invalid:border-destructive/70 bg-black/20 flex field-sizing-content min-h-16 w-full rounded-lg border px-3.5 py-2.5 text-base shadow-sm transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
