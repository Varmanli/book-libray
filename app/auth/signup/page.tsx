"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, KeyRound, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { VerificationCodePanel } from "@/components/auth/VerificationCodePanel";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const passwordValue = watch("password");

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "ثبت‌نام ناموفق بود");
        return;
      }

      toast.success("ثبت‌نام انجام شد. کد تایید برایت آماده است.");
      setPendingEmail(values.email.trim().toLowerCase());
      setDevCode(data.devCode ?? null);
    } catch {
      setServerError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={pendingEmail ? "تایید ایمیل" : "ساخت حساب جدید"}
      subtitle={
        pendingEmail
          ? "برای فعال‌سازی حسابت کد ۴ رقمی ارسال‌شده را وارد کن"
          : "چند ثانیه تا ساختن قفسه‌ی شخصی‌ات فاصله مانده است"
      }
      footer={
        <p className="text-center">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-emerald-200 transition-colors hover:text-emerald-100"
          >
            وارد شوید
          </Link>
        </p>
      }
    >
      {pendingEmail ? (
        <VerificationCodePanel
          email={pendingEmail}
          purpose="email_verification"
          title="کد تایید ایمیل"
          subtitle="حساب ساخته شد. برای فعال‌سازی ورود، کد ۴ رقمی را وارد کن."
          submitLabel="تایید ایمیل"
          successMessage="ایمیل شما تایید شد."
          initialDevCode={devCode}
          onVerified={() => {
            router.push("/auth/login?verified=1");
          }}
        />
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-4">
            <GoogleAuthButton />
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold text-white/45">یا</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>

          {serverError && <AuthAlert>{serverError}</AuthAlert>}

          <AuthInput
            id="name"
            label="نام"
            autoComplete="name"
            placeholder="نام شما"
            icon={<UserRound className="h-4 w-4" />}
            error={errors.name?.message}
            {...register("name")}
          />

          <AuthInput
            id="email"
            label="ایمیل"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            icon={<AtSign className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="space-y-2.5">
            <AuthInput
              id="password"
              label="رمز عبور"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              placeholder="حداقل ۸ کاراکتر شامل حرف و عدد"
              icon={<KeyRound className="h-4 w-4" />}
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrength value={passwordValue} />
          </div>

          <AuthInput
            id="confirmPassword"
            label="تکرار رمز عبور"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            placeholder="••••••••"
            icon={<KeyRound className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <AuthButton type="submit" loading={submitting}>
            {submitting ? "در حال ثبت‌نام..." : "ایجاد حساب کاربری"}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
