import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function AdminFormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.8rem] border border-border/75 bg-card/75 p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-6",
        className,
      )}
    >
      <div className="mb-5 border-b border-border/60 pb-4">
        <h2 className="text-base font-black text-foreground sm:text-lg">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
