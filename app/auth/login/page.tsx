"use client";

import {
  Suspense,
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, BookOpen, LockKeyhole, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { VerificationCodePanel } from "@/components/auth/VerificationCodePanel";
import { cn } from "@/lib/utils";

const LOGIN_STORAGE_KEY = "ghafaseh-login-form";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/books";

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [mode, setMode] = useState<"password" | "code">("password");
  const [codeEmail, setCodeEmail] = useState("");
  const [codeChallengeEmail, setCodeChallengeEmail] = useState<string | null>(
    null,
  );
  const [codeRequesting, setCodeRequesting] = useState(false);
  const [codeRequestError, setCodeRequestError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true },
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;
  const passwordField = register("password");

  const rememberMe = watch("rememberMe");

  useEffect(() => {
    if (searchParams.get("registered")) {
      toast.success("ثبت‌نام انجام شد؛ اکنون وارد شوید.");
    } else if (searchParams.get("reset")) {
      toast.success("رمز عبور تغییر کرد؛ با رمز جدید وارد شوید.");
    } else if (searchParams.get("verified")) {
      toast.success("ایمیل شما تایید شد؛ اکنون می‌توانید وارد شوید.");
    } else if (searchParams.get("google_error")) {
      toast.error("ورود با گوگل ناموفق بود. دوباره تلاش کنید.");
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOGIN_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<LoginInput>;
      if (saved.identifier) setValue("identifier", saved.identifier);
      if (typeof saved.rememberMe === "boolean") {
        setValue("rememberMe", saved.rememberMe);
      }
    } catch {}
  }, [setValue]);

  useEffect(() => {
    const subscription = watch((values) => {
      try {
        window.localStorage.setItem(
          LOGIN_STORAGE_KEY,
          JSON.stringify({
            identifier: values.identifier ?? "",
            rememberMe: values.rememberMe ?? true,
          }),
        );
      } catch {}
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  async function onSubmit(values: LoginInput) {
    if (submitting) return;
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "ورود ناموفق بود.");
        return;
      }

      toast.success("خوش آمدید!");
      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestLoginCode() {
    setCodeRequestError(null);
    setCodeRequesting(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: codeEmail, purpose: "login" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCodeRequestError(data.error || "ارسال کد ناموفق بود.");
        return;
      }

      setDevCode(data.devCode ?? null);
      setCodeChallengeEmail(codeEmail.trim().toLowerCase());
      toast.success("اگر ایمیل معتبر باشد، کد تایید ارسال شد.");
    } catch {
      setCodeRequestError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setCodeRequesting(false);
    }
  }

  return (
    <AuthCard
      title="به قفسه خود خوش آمدید"
      subtitle="کتاب‌ها، تجربه‌ها و مسیر مطالعه شما اینجا منتظر شماست"
      footer={
        <p className="text-center">
          حساب کاربری ندارید؟{" "}
          <Link
            href="/auth/signup"
            className="font-semibold text-emerald-200 transition-colors hover:text-emerald-100"
          >
            ثبت‌نام کنید
          </Link>
        </p>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={cn(
            "rounded-[1rem] px-3 py-2 text-sm font-bold transition-colors",
            mode === "password"
              ? "bg-emerald-200 text-emerald-950"
              : "text-white/65 hover:text-white",
          )}
        >
          ورود با رمز عبور
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={cn(
            "rounded-[1rem] px-3 py-2 text-sm font-bold transition-colors",
            mode === "code"
              ? "bg-emerald-200 text-emerald-950"
              : "text-white/65 hover:text-white",
          )}
        >
          ورود با کد تایید
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <GoogleAuthButton redirectTo={redirectTo} />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold text-white/45">یا</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>

      {mode === "code" ? (
        <div className="space-y-5">
          {!codeChallengeEmail ? (
            <>
              {codeRequestError ? (
                <AuthAlert>{codeRequestError}</AuthAlert>
              ) : null}
              <AuthInput
                id="code-email"
                label="ایمیل"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                placeholder="you@example.com"
                icon={<AtSign className="h-4 w-4" />}
                value={codeEmail}
                onChange={(event) => setCodeEmail(event.target.value)}
              />
              <AuthButton
                type="button"
                loading={codeRequesting}
                disabled={!codeEmail.trim()}
                onClick={requestLoginCode}
              >
                {codeRequesting ? "در حال ارسال..." : "دریافت کد ورود"}
              </AuthButton>
            </>
          ) : (
            <>
              {codeRequestError ? (
                <AuthAlert>{codeRequestError}</AuthAlert>
              ) : null}
              <VerificationCodePanel
                email={codeChallengeEmail}
                purpose="login"
                title="ورود با کد تایید"
                subtitle="کد ۴ رقمی را وارد کن تا بدون رمز عبور وارد قفسه شوی."
                submitLabel="ورود به قفسه"
                successMessage="خوش آمدید!"
                initialDevCode={devCode}
                onVerified={() => {
                  router.push(redirectTo);
                  router.refresh();
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setCodeChallengeEmail(null);
                  setDevCode(null);
                }}
                className="w-full text-center text-sm font-semibold text-white/55 transition-colors hover:text-white/80"
              >
                تغییر ایمیل
              </button>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {serverError && <AuthAlert>{serverError}</AuthAlert>}

          <AuthInput
            id="identifier"
            label="ایمیل یا نام کاربری"
            placeholder="you@example.com یا username"
            autoComplete="username"
            dir="ltr"
            icon={<AtSign className="h-4 w-4" />}
            error={errors.identifier?.message}
            {...register("identifier")}
          />

          <AuthInput
            id="password"
            label="رمز عبور"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            placeholder="••••••••"
            icon={<LockKeyhole className="h-4 w-4" />}
            error={errors.password?.message}
            action={
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-emerald-200/85 transition-colors hover:text-emerald-100"
              >
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            }
            {...passwordField}
            onKeyUp={(event: KeyboardEvent<HTMLInputElement>) => {
              setCapsLockOn(event.getModifierState("CapsLock"));
            }}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              setCapsLockOn(event.getModifierState("CapsLock"));
            }}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              passwordField.onBlur(event);
              setCapsLockOn(false);
            }}
          />

          {capsLockOn ? (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200/10 bg-amber-200/8 px-3 py-2.5 text-sm text-amber-100/85">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span>Caps Lock روشن است.</span>
            </div>
          ) : null}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/76 transition-colors hover:border-white/14 hover:bg-white/[0.05]">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-200/70" />
              مرا بخاطر بسپار
            </span>
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                {...register("rememberMe")}
              />
              <span className="h-6 w-11 rounded-full bg-white/12 transition-colors peer-checked:bg-emerald-300/70" />
              <span className="absolute right-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:-translate-x-5" />
            </span>
          </label>

          <AuthButton type="submit" loading={submitting}>
            {submitting ? "در حال ورود..." : "ورود به حساب کاربری"}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
