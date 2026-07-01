"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { VerificationCodePanel } from "@/components/auth/VerificationCodePanel";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "ارسال درخواست ناموفق بود");
        return;
      }

      setEmail(values.email.trim().toLowerCase());
      setDevCode(data.devCode ?? null);
    } catch {
      setServerError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={email ? "تایید کد بازیابی" : "بازیابی رمز عبور"}
      subtitle={
        email
          ? "کد ۴ رقمی بازیابی را وارد کن تا رمز جدید انتخاب شود."
          : "ایمیلت را وارد کن تا کد بازیابی برایت ارسال شود."
      }
      footer={
        <p className="text-center">
          <Link
            href="/auth/login"
            className="font-semibold text-emerald-200 transition-colors hover:text-emerald-100"
          >
            بازگشت به ورود
          </Link>
        </p>
      }
    >
      {email ? (
        <VerificationCodePanel
          email={email}
          purpose="password_reset"
          title="کد بازیابی رمز"
          subtitle="پس از تایید کد، به مرحله‌ی تعیین رمز جدید هدایت می‌شوی."
          submitLabel="تایید کد"
          successMessage="کد بازیابی تایید شد."
          initialDevCode={devCode}
          onVerified={(payload) => {
            if (payload?.resetToken) {
              router.push(`/auth/reset-password?token=${encodeURIComponent(payload.resetToken)}`);
            } else {
              setServerError("توکن بازنشانی دریافت نشد. دوباره تلاش کنید.");
            }
          }}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && <AuthAlert>{serverError}</AuthAlert>}

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

          <AuthButton type="submit" loading={submitting}>
            {submitting ? "در حال ارسال..." : "دریافت کد بازیابی"}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
