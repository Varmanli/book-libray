import { cn } from "@/lib/utils";

type BrandLogoSize = "header" | "footer" | "mobile" | "auth" | "admin";

const sizeClasses: Record<BrandLogoSize, string> = {
  header: "h-10 w-36 rounded-2xl",
  footer: "h-10 w-36 rounded-2xl",
  mobile: "h-8 w-28 rounded-xl",
  auth: "h-14 w-56 rounded-2xl",
  admin: "h-8 w-28 rounded-xl",
};

export function BrandLogo({
  siteName,
  size = "header",
  className,
  logoClassName,
  fallbackClassName,
}: {
  logoUrl?: string | null;
  siteName?: string | null;
  size?: BrandLogoSize;
  showName?: boolean;
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
  fallbackClassName?: string;
}) {
  const name = siteName?.trim() || "قفسه";

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          sizeClasses[size],
          fallbackClassName,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt={`لوگوی ${name}`}
          className={cn("h-full w-full object-contain", logoClassName)}
        />
      </span>
    </span>
  );
}
