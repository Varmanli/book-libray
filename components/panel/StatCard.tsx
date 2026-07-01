import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "lime",
  className,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone?: "lime" | "sky" | "amber" | "rose";
  className?: string;
}) {
  const tones = {
    lime: "text-[#d4ff6a]",
    sky: "text-sky-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  };

  return (
    <div className={cn("rounded-[24px] border border-border bg-black/18 p-4", className)}>
      <Icon className={cn("h-5 w-5", tones[tone])} />
      <div className="mt-3 text-2xl font-black text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
