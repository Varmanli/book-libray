"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Loader2, Shield, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/upload/ImageUploader";

type Detail = { user: { id:string; name:string|null; username:string|null; email:string|null; image:string|null; bio:string|null; role:"USER"|"ADMIN"; createdAt:string }; activity:{books:number;read:number;notes:number;thoughts:number} };
export default function AdminUserDetail({ userId }: { userId: string }) {
 const [data,setData]=useState<Detail|null>(null); const [saving,setSaving]=useState(false); const [avatarUploading,setAvatarUploading]=useState(false); const [avatarSaving,setAvatarSaving]=useState(false);
 useEffect(() => {
  let active = true;

  void fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { credentials: "include" })
   .then(async (response) => {
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
     throw new Error(payload.error || "کاربر پیدا نشد");
    }
    return { user: payload.user, activity: payload.activity };
   })
   .then((detail: Detail) => {
    if (active) setData(detail);
   })
   .catch((error) => {
    if (active) toast.error(error instanceof Error ? error.message : "خطا در بارگذاری");
   });

  return () => {
   active = false;
  };
 }, [userId]);
 if(!data) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
 const {user,activity}=data; const save=async()=>{ setSaving(true); try { const r=await fetch(`/api/admin/users/${userId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:user.name||null,username:user.username||null,email:user.email||null,bio:user.bio||null})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); toast.success(d.message); } catch(e){toast.error(e instanceof Error?e.message:"ذخیره ناموفق بود");} finally{setSaving(false);} };
 const update=(key:"name"|"username"|"email"|"bio", value:string)=>setData(c=>c?{...c,user:{...c.user,[key]:value}}:c);
 const persistAvatar=async(nextImage:string)=>{const previousImage=user.image; const image=nextImage||null; setAvatarSaving(true); try{const r=await fetch(`/api/admin/users/${userId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({image})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"ذخیره تصویر ناموفق بود"); setData(c=>c?{...c,user:{...c.user,image}}:c); toast.success("تصویر پروفایل ذخیره شد.");}catch(error){setData(c=>c?{...c,user:{...c.user,image:previousImage}}:c);toast.error(error instanceof Error?error.message:"ذخیره تصویر ناموفق بود.");}finally{setAvatarSaving(false);}};
 const activityItems: Array<{label:string; value:number; Icon:typeof BookOpen}> = [{label:"کتاب‌ها",value:activity.books,Icon:BookOpen},{label:"خوانده‌شده",value:activity.read,Icon:BookOpen},{label:"یادداشت‌ها",value:activity.notes,Icon:FileText},{label:"برداشت‌های عمومی",value:activity.thoughts,Icon:UserRound}];
 const changeRole=async()=>{const role=user.role==="ADMIN"?"USER":"ADMIN"; const r=await fetch(`/api/admin/users/${userId}/role`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({role})}); const d=await r.json(); if(!r.ok)return toast.error(d.error||"عملیات ناموفق بود"); setData(c=>c?{...c,user:{...c.user,role}}:c); toast.success(d.message);};
 return <div className="space-y-6"><Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4"/>بازگشت به کاربران</Link><section className="rounded-2xl border border-border/70 bg-card/70 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><Avatar className="h-20 w-20 ring-1 ring-border">{user.image&&<AvatarImage src={user.image} alt="" className="object-cover"/>}<AvatarFallback className="text-2xl">{(user.name||user.username||"ق").charAt(0)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h1 className="text-xl font-black text-foreground">{user.name||"بدون نام"}</h1><p dir="ltr" className="mt-1 text-sm text-muted-foreground">@{user.username||"—"} · {user.email||"—"}</p><p className="mt-2 text-xs text-muted-foreground">عضویت: {new Date(user.createdAt).toLocaleDateString("fa-IR")}</p></div><span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{user.role==="ADMIN"?"مدیر":"کاربر"}</span></div></section><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-border/70 bg-card/70 p-5"><h2 className="font-black">ویرایش پروفایل</h2><div className="mt-4 space-y-5"><ImageUploader value={user.image} onChange={persistAvatar} onUploadStateChange={setAvatarUploading} folder="avatars" variant="avatar" label="آواتار" targetOwnerId={userId} disabled={saving||avatarUploading||avatarSaving}/><div className="space-y-3"><Input value={user.name||""} onChange={e=>update("name",e.target.value)} placeholder="نام نمایشی"/><Input dir="ltr" value={user.username||""} onChange={e=>update("username",e.target.value)} placeholder="username"/><Input dir="ltr" value={user.email||""} onChange={e=>update("email",e.target.value)} placeholder="email@example.com"/><Textarea value={user.bio||""} onChange={e=>update("bio",e.target.value)} placeholder="بیوگرافی"/><Button onClick={save} disabled={saving||avatarUploading||avatarSaving} className="w-full">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}ذخیره تغییرات</Button></div></div></section><div className="space-y-6"><section className="rounded-2xl border border-border/70 bg-card/70 p-5"><div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/><h2 className="font-black">نقش کاربر</h2></div><p className="mt-3 text-sm text-muted-foreground">نقش فعلی: {user.role==="ADMIN"?"مدیر":"کاربر"}</p><Button variant="outline" onClick={changeRole} className="mt-4">{user.role==="ADMIN"?"حذف دسترسی مدیر":"ارتقا به مدیر"}</Button></section><section className="rounded-2xl border border-border/70 bg-card/70 p-5"><h2 className="font-black">فعالیت کاربر</h2><div className="mt-4 grid grid-cols-2 gap-3">{activityItems.map(({label,value,Icon})=><div key={label} className="rounded-xl border border-border/60 bg-background/40 p-3"><Icon className="h-4 w-4 text-primary"/><p className="mt-2 text-lg font-black tabular-nums">{value.toLocaleString("fa-IR")}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div></section></div></div></div>;
}
