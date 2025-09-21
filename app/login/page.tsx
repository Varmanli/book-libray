"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { PageLoading } from "@/components/Loading";

import bg from "../../public/library.webp";

const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "حداقل ۶ کاراکتر"),
});

const registerSchema = z.object({
  username: z.string().min(3, "حداقل ۳ کاراکتر"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "حداقل ۶ کاراکتر"),
});

const forgotSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const form = useForm<LoginForm | RegisterForm | ForgotForm>({
    resolver: zodResolver(
      mode === "login"
        ? loginSchema
        : mode === "register"
        ? registerSchema
        : forgotSchema
    ),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          // User is already logged in, redirect to dashboard
          router.push("/books");
          return;
        }
      } catch (err) {
        console.error("Error checking auth:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  async function onSubmit(values: LoginForm | RegisterForm | ForgotForm) {
    try {
      setLoading(true); // شروع لودینگ
      let url: string = "";
      let body: Record<string, string> = {};

      if (mode === "register") {
        url = "/api/auth/register";
        body = {
          name: (values as RegisterForm).username,
          email: (values as RegisterForm).email,
          password: (values as RegisterForm).password,
        };
      } else if (mode === "login") {
        url = "/api/auth/login";
        body = {
          email: (values as LoginForm).email,
          password: (values as LoginForm).password,
        };
      } else if (mode === "forgot") {
        url = "/api/auth/forgot";
        body = { email: (values as ForgotForm).email };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: { message?: string; error?: string } = await res.json();

      if (!res.ok) {
        toast.error(data.error || "خطا رخ داده");
        return;
      }

      toast.success(data.message || "عملیات موفق بود");

      if (mode === "register") {
        setMode("login");
        return;
      }

      if (mode === "login") {
        router.push("/books");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطای سرور");
    } finally {
      setLoading(false); // پایان لودینگ
    }
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return <PageLoading text="در حال بررسی احراز هویت..." />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen relative bg-[#1C1C22]">
      <div>
        <Image src={bg} alt="library image" fill className="z-0 absolute" />
        <div className="z-10 bg-black/20 absolute top-0 bottom-0 right-0 left-0"></div>
      </div>
      <Card className="w-full mx-2 max-w-md p-6 shadow-lg z-20 bg-[#26262E]/90 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === "login" && "ورود"}
            {mode === "register" && "ثبت‌نام"}
            {mode === "forgot" && "فراموشی رمز عبور"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-4"
            >
              {mode === "register" && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام کاربری</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <Input {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(mode === "login" || mode === "register") && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز عبور</FormLabel>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full bg-[#00FF99] hover:bg-[#00FF99]/90 text-black font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ارسال...
                  </span>
                ) : (
                  <>
                    {mode === "login" && "ورود"}
                    {mode === "register" && "ثبت‌نام"}
                    {mode === "forgot" && "ارسال لینک بازیابی"}
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="flex justify-between mt-4 text-sm">
            {mode !== "login" && (
              <button
                onClick={() => setMode("login")}
                className="text-[#00FF99] hover:text-[#00FF99]/80 transition-colors"
              >
                ورود
              </button>
            )}
            {mode !== "register" && (
              <button
                onClick={() => setMode("register")}
                className="text-[#00FF99] hover:text-[#00FF99]/80 transition-colors"
              >
                ثبت‌نام
              </button>
            )}
            {mode !== "forgot" && (
              <button
                onClick={() => setMode("forgot")}
                className="text-[#00FF99] hover:text-[#00FF99]/80 transition-colors"
              >
                فراموشی رمز
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
