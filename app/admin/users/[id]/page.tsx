import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/permissions";
import AdminUserDetail from "@/components/admin/users/AdminUserDetail";
export default async function AdminUserDetailPage({params}:{params:Promise<{id:string}>}) { await requireAdmin(); const {id}=await params; if(!id) notFound(); return <AdminUserDetail userId={id}/>; }
