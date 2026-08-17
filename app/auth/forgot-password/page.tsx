"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

      setSubmitted(true);
    } catch {
      setServerError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={submitted ? "ایمیل بازیابی ارسال شد" : "بازیابی رمز عبور"}
      subtitle={
        submitted
          ? "اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی را دریافت می‌کنی."
          : "ایمیلت را وارد کن تا لینک بازیابی برایت ارسال شود."
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
      {submitted ? (
        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-200/8 px-4 py-3 text-sm text-emerald-50/90">
          پوشهٔ Spam را هم بررسی کنید. اگر ایمیل را دریافت نکردید، کمی بعد دوباره تلاش کنید.
        </div>
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
            {submitting ? "در حال ارسال..." : "دریافت لینک بازیابی"}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
