"use client";

import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Check, Loader2, Save, X, Globe, Lock, UserRound, Shield } from "lucide-react";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { PageLoading } from "@/components/Loading";
import { isValidUsername, normalizeUsername } from "@/lib/profile/username-rules";

interface FormValues {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  instagram: string;
  twitter: string;
  telegram: string;
  linkedin: string;
  image: string | null;
  bannerImage: string | null;
}

const EMPTY: FormValues = {
  name: "",
  username: "",
  bio: "",
  location: "",
  website: "",
  instagram: "",
  twitter: "",
  telegram: "",
  linkedin: "",
  image: null,
  bannerImage: null,
};

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";
type MediaField = "image" | "bannerImage";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [initialUsername, setInitialUsername] = useState<string>("");
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");

  const { register, handleSubmit, reset, watch, setError, setValue, formState } =
    useForm<FormValues>({ defaultValues: EMPTY });

  const usernameValue = watch("username");
  const avatar = watch("image");
  const banner = watch("bannerImage");

  // بارگذاری پروفایل فعلی
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profile?_=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = data.profile;
          reset({
            name: p.name ?? "",
            username: p.username ?? "",
            bio: p.bio ?? "",
            location: p.location ?? "",
            website: p.website ?? "",
            instagram: p.instagram ?? "",
            twitter: p.twitter ?? "",
            telegram: p.telegram ?? "",
            linkedin: p.linkedin ?? "",
            image: p.image ?? null,
            bannerImage: p.bannerImage ?? null,
          });
          setVisibility(p.profileVisibility ?? "PRIVATE");
          setInitialUsername(p.username ?? "");
        } else {
          toast.error("خطا در بارگذاری پروفایل");
        }
      } catch {
        toast.error("ارتباط با سرور برقرار نشد");
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  // بررسی زنده‌ی در دسترس بودن نام کاربری
  useEffect(() => {
    const u = normalizeUsername(usernameValue || "");
    if (!u || u === initialUsername.toLowerCase()) {
      setUsernameState("idle");
      return;
    }
    if (!isValidUsername(u)) {
      setUsernameState("invalid");
      return;
    }
    setUsernameState("checking");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/username-availability?username=${encodeURIComponent(u)}`,
          { credentials: "include", signal: ctrl.signal }
        );
        const data = await res.json();
        if (!data.valid) setUsernameState("invalid");
        else setUsernameState(data.available ? "available" : "taken");
      } catch (err) {
        if (!(err instanceof DOMException)) setUsernameState("idle");
      }
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [usernameValue, initialUsername]);

  const persistMediaField = async (
    field: MediaField,
    nextValue: string | null,
    previousValue: string | null
  ) => {
    const setSavingState =
      field === "image" ? setAvatarSaving : setBannerSaving;
    const payload = { [field]: nextValue };

    setSavingState(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "ذخیره تصویر ناموفق بود");
      }

      setValue("image", result.profile?.image ?? null, {
        shouldDirty: false,
        shouldTouch: true,
        shouldValidate: false,
      });
      setValue("bannerImage", result.profile?.bannerImage ?? null, {
        shouldDirty: false,
        shouldTouch: true,
        shouldValidate: false,
      });
      toast.success(
        field === "image"
          ? "تصویر پروفایل ذخیره شد."
          : "بنر پروفایل ذخیره شد."
      );
      router.refresh();
    } catch (error) {
      setValue(field, previousValue, {
        shouldDirty: false,
        shouldTouch: true,
        shouldValidate: false,
      });
      toast.error(
        error instanceof Error ? error.message : "ذخیره تصویر ناموفق بود."
      );
    } finally {
      setSavingState(false);
    }
  };

  const handleMediaChange = (field: MediaField, url: string) => {
    const normalized = url || null;
    const previousValue = field === "image" ? avatar : banner;
    setValue(field, normalized, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    void persistMediaField(field, normalized, previousValue);
  };

  const onSubmit = async (data: FormValues) => {
    if (usernameState === "taken" || usernameState === "invalid") {
      setError("username", {
        message:
          usernameState === "taken"
            ? "این نام کاربری قبلاً انتخاب شده است"
            : "نام کاربری نامعتبر است",
      });
      return;
    }

    setSaving(true);
    try {
      const trimmedUsername = normalizeUsername(data.username);
      const payload: Record<string, unknown> = {
        name: data.name.trim() || null,
        bio: data.bio.trim() || null,
        location: data.location.trim() || null,
        website: data.website.trim() || null,
        linkedin: data.linkedin.trim() || null,
        instagram: data.instagram.trim() || null,
        twitter: data.twitter.trim() || null,
        telegram: data.telegram.trim() || null,
        image: data.image,
        bannerImage: data.bannerImage,
        visibility,
      };
      if (trimmedUsername && trimmedUsername !== initialUsername.toLowerCase()) {
        payload.username = trimmedUsername;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.code === "USERNAME_TAKEN") {
          setError("username", { message: result.error });
          setUsernameState("taken");
        }
        toast.error(result.error || "ذخیره ناموفق بود");
        return;
      }
      toast.success(result.message || "پروفایل ذخیره شد");
      setInitialUsername(result.profile?.username ?? trimmedUsername);
      reset({
        name: result.profile?.name ?? data.name,
        username: result.profile?.username ?? trimmedUsername ?? data.username,
        bio: result.profile?.bio ?? data.bio,
        location: result.profile?.location ?? data.location,
        website: result.profile?.website ?? data.website,
        instagram: result.profile?.instagram ?? data.instagram,
        twitter: result.profile?.twitter ?? data.twitter,
        telegram: result.profile?.telegram ?? data.telegram,
        linkedin: result.profile?.linkedin ?? data.linkedin,
        image: result.profile?.image ?? data.image,
        bannerImage: result.profile?.bannerImage ?? data.bannerImage,
      });
      setUsernameState("idle");
      router.refresh();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading text="در حال بارگذاری پروفایل..." />;

  const hasActiveUpload =
    avatarUploading || bannerUploading || avatarSaving || bannerSaving;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-sm"
    >
      <div className="divide-y divide-border/60">
        {/* هویت بصری: بنر + آواتار */}
        <section className="space-y-6 p-6 sm:p-8">
          <SectionTitle icon={UserRound}>هویت بصری</SectionTitle>

          <ImageUploader
            value={banner}
            onChange={(url) => handleMediaChange("bannerImage", url)}
            onUploadStateChange={setBannerUploading}
            folder="banners"
            variant="banner"
            label="بنر"
            overlayActions
            disabled={saving || hasActiveUpload}
          />

          <ImageUploader
            value={avatar}
            onChange={(url) => handleMediaChange("image", url)}
            onUploadStateChange={setAvatarUploading}
            folder="avatars"
            variant="avatar"
            label="آواتار"
            disabled={saving || hasActiveUpload}
          />
        </section>

        {/* اطلاعات اصلی */}
        <section className="space-y-4 p-6 sm:p-8">
          <SectionTitle>اطلاعات اصلی</SectionTitle>

          <div className="space-y-1.5">
            <Label htmlFor="name">نام نمایشی</Label>
            <Input id="name" {...register("name")} placeholder="نام شما" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">نام کاربری</Label>
            <FieldGroup>
              <span className="select-none text-sm text-muted-foreground">@</span>
              <input
                id="username"
                dir="ltr"
                {...register("username")}
                placeholder="username"
                className={HANDLE_INPUT_CLASS}
              />
              <span className="flex w-4 shrink-0 items-center justify-center">
                {usernameState === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameState === "available" && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                {(usernameState === "taken" || usernameState === "invalid") && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </span>
            </FieldGroup>
            {usernameState === "taken" && (
              <p className="text-xs text-destructive/90">
                این نام کاربری قبلاً انتخاب شده است.
              </p>
            )}
            {usernameState === "invalid" && (
              <p className="text-xs text-destructive/90">
                فقط حروف کوچک، عدد و خط تیره؛ باید با حرف شروع شود.
              </p>
            )}
            {formState.errors.username && usernameState === "idle" && (
              <p className="text-xs text-destructive/90">
                {formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">درباره‌ی من</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              maxLength={500}
              className="min-h-24"
              placeholder="چند خط درباره‌ی خودت..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">موقعیت مکانی</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="مثلاً: تهران، ایران"
            />
          </div>
        </section>

        {/* شبکه‌های اجتماعی */}
        <section className="space-y-4 p-6 sm:p-8">
          <SectionTitle>شبکه‌های اجتماعی</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="website">وب‌سایت</Label>
              <Input
                id="website"
                dir="ltr"
                {...register("website")}
                placeholder="https://example.com"
                className="text-left"
              />
            </div>
            <HandleField
              id="instagram"
              label="اینستاگرام"
              registration={register("instagram")}
            />
            <HandleField
              id="twitter"
              label="ایکس (توییتر)"
              registration={register("twitter")}
            />
            <HandleField
              id="telegram"
              label="تلگرام"
              registration={register("telegram")}
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="linkedin">لینکدین</Label>
              <Input
                id="linkedin"
                dir="ltr"
                {...register("linkedin")}
                placeholder="https://linkedin.com/in/..."
                className="text-left"
              />
            </div>
          </div>
        </section>

        {/* حریم خصوصی */}
        <section className="space-y-4 p-6 sm:p-8">
          <SectionTitle icon={Shield}>حریم خصوصی</SectionTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="visibility">نمایش پروفایل</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as "PUBLIC" | "PRIVATE")}
            >
              <SelectTrigger id="visibility" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> عمومی
                  </span>
                </SelectItem>
                <SelectItem value="PRIVATE">
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> خصوصی
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* اقدامات */}
        <section className="flex justify-end px-6 py-5 sm:px-8">
          <Button
            type="submit"
            disabled={saving || hasActiveUpload}
            className="h-11 w-full gap-2 px-8 font-semibold sm:w-auto"
          >
            {saving || hasActiveUpload ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {hasActiveUpload ? "در حال آپلود..." : "در حال ذخیره..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </section>
      </div>
    </form>
  );
}

/** عنوان کوتاه و یکدست برای هر بخش فرم. */
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
      {children}
    </h2>
  );
}

/** کلاس ورودی برهنه‌ی داخل گروه فیلد — هم‌اندازه با کامپوننت Input. */
const HANDLE_INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-left text-base outline-none placeholder:text-muted-foreground/60 md:text-sm";

/**
 * گروه فیلد با ظاهر یکسان با Input؛ پیشوند و ورودی به‌صورت آیتم‌های flex
 * کنار هم قرار می‌گیرند تا هیچ‌وقت روی هم نیفتند. محتوا LTR است.
 */
function FieldGroup({ children }: { children: ReactNode }) {
  return (
    <div
      dir="ltr"
      className="flex h-10 w-full items-center gap-1.5 rounded-lg border border-input/70 bg-black/20 px-3 shadow-sm transition-[color,box-shadow,border-color] hover:border-border focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-primary/25"
    >
      {children}
    </div>
  );
}

/** فیلد هندل (نام‌کاربری‌محور) با پیشوند ثابت @ و ورودی LTR. */
function HandleField({
  id,
  label,
  registration,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <FieldGroup>
        <span className="select-none text-sm text-muted-foreground">@</span>
        <input
          id={id}
          dir="ltr"
          {...registration}
          placeholder="username"
          className={HANDLE_INPUT_CLASS}
        />
      </FieldGroup>
    </div>
  );
}
