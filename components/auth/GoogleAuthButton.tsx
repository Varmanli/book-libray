import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";

export function GoogleAuthButton({ redirectTo }: { redirectTo?: string }) {
  const href = redirectTo
    ? `/api/auth/google/start?redirect=${encodeURIComponent(redirectTo)}`
    : "/api/auth/google/start";

  return (
    <AuthButton asChild type="button" variant="outline">
      <Link href={href}>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#4285F4]">
          G
        </span>
        ادامه با گوگل
      </Link>
    </AuthButton>
  );
}
