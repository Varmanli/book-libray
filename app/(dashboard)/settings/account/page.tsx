"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Mail, Shield, Lock } from "lucide-react";
import toast from "react-hot-toast";

import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/auth";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthAlert } from "@/components/auth/AuthAlert";

export default function AccountSettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        const data = await res.json();
        if (res.ok) setEmail(data.profile?.email ?? null);
      } catch {
        /* بی‌صدا */
      }
    })();
  }, []);

  const onSubmit = async (values: ChangePasswordInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "تغییر رمز ناموفق بود");
        return;
      }
      toast.success(data.message || "رمز عبور تغییر کرد");
      form.reset();
    } catch {
      setServerError("ارتباط با سرور برقرار نشد");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* اطلاعات حساب */}
      <section className="rounded-[30px] border border-border bg-gradient-to-b from-card/70 to-card/40 p-6 shadow-lg shadow-black/20 sm:p-7">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail className="h-4 w-4 text-primary" />
          اطلاعات حساب
        </h2>
        <Label className="pb-2">ایمیل</Label>
        <div
          dir="ltr"
          className="flex h-10 items-center rounded-lg border border-input/70 bg-black/20 px-3 text-sm text-muted-foreground"
        >
          {email ?? "—"}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          تغییر ایمیل در این نسخه پشتیبانی نمی‌شود.
        </p>
      </section>

      <section className="rounded-[30px] border border-border bg-gradient-to-b from-card/70 to-card/40 p-6 shadow-lg shadow-black/20 sm:p-7">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          امنیت و حریم خصوصی
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              رمز عبور امن
            </div>
            برای حسابی که بعداً قرار است قابلیت‌های اجتماعی بیشتری بگیرد، رمز
            عبور قوی و منحصربه‌فرد نگه دار.
          </div>
          <div className="rounded-2xl border border-border bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
            نمایانی پروفایل از بخش «تنظیمات پروفایل» کنترل می‌شود و روی دیدن
            کتابخانه‌ی تو توسط دیگران اثر مستقیم دارد.
          </div>
        </div>
      </section>

      {/* تغییر رمز عبور */}
      <section className="rounded-[30px] border border-border bg-gradient-to-b from-card/70 to-card/40 p-6 shadow-lg shadow-black/20 sm:p-7">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" />
          تغییر رمز عبور
        </h2>
        <p className="mb-5 text-sm leading-7 text-muted-foreground">
          بعد از تغییر رمز، نشست فعلی تو باقی می‌ماند اما از این به بعد باید با
          رمز جدید وارد شوی.
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {serverError && <AuthAlert>{serverError}</AuthAlert>}

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رمز عبور فعلی</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      dir="ltr"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رمز عبور جدید</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="حداقل ۸ کاراکتر شامل حرف و عدد"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تکرار رمز عبور جدید</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 sm:w-auto sm:px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال تغییر...
                </>
              ) : (
                "تغییر رمز عبور"
              )}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
}
