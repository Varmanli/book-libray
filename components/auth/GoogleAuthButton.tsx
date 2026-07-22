"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";

export function GoogleAuthButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);

  const href = redirectTo
    ? `/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`
    : "/api/auth/google";

  return (
    <AuthButton
      type="button"
      variant="outline"
      loading={loading}
      className="
        group relative h-12 w-full overflow-hidden
        rounded-xl
        border border-slate-200
        bg-white
        text-slate-700
        shadow-sm
        transition-all duration-300

        hover:border-slate-300
        hover:bg-gradient-to-r
        hover:from-white
        hover:to-slate-50
        hover:shadow-lg
        hover:shadow-slate-200/50

        active:scale-[0.985]
      "
      onClick={() => {
        setLoading(true);
        window.location.assign(href);
      }}
    >
      <span className="relative flex w-full items-center justify-center gap-3">
        {/* Google Logo Container */}
        <span
          className="
            flex h-8 w-8 items-center justify-center
            rounded-lg
            border border-slate-100
            bg-white
            shadow-sm
            transition-all duration-300

            group-hover:-translate-y-0.5
            group-hover:shadow-md
          "
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M21.35 12.23c0-.7-.06-1.37-.2-2H12v3.79h5.23a4.47 4.47 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.92-4.2 2.92-7.17Z"
            />
            <path
              fill="#34A853"
              d="M12 21.5c2.64 0 4.86-.87 6.48-2.36l-3.14-2.44c-.87.58-1.98.92-3.34.92-2.56 0-4.73-1.73-5.51-4.06H3.25V16.1A9.5 9.5 0 0 0 12 21.5Z"
            />
            <path
              fill="#FBBC05"
              d="M6.49 13.56a5.7 5.7 0 0 1 0-3.62V7.5H3.25a9.5 9.5 0 0 0 0 8.5l3.24-2.44Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.88c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.85 2.97 14.64 2 12 2a9.5 9.5 0 0 0-8.75 5.5l3.24 2.44C7.27 7.61 9.44 5.88 12 5.88Z"
            />
          </svg>
        </span>

        <span
          className="
          flex flex-col items-start leading-none
          text-right
        "
        >
          <span
            className="
            text-sm font-semibold
            transition-colors
             text-white
            group-hover:text-slate-900
          "
          >
            ادامه با گوگل
          </span>
        </span>
      </span>

      {/* subtle hover glow */}
      <span
        className="
          pointer-events-none absolute inset-0
          bg-gradient-to-r
          from-transparent
          via-white/40
         
          to-transparent
          translate-x-[-120%]
          transition-transform duration-700
          group-hover:translate-x-[120%]
        "
      />
    </AuthButton>
  );
}
