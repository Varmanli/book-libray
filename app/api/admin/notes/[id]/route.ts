import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { deleteAdminNote, updateAdminNote } from "@/lib/admin/user-content";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const gate = await assertAdminApi(); if ("error" in gate) return gate.error; try { const { id } = await params; const note = await updateAdminNote(id, await req.json()); return apiSuccess({ note, message: "یادداشت ویرایش شد" }); } catch (error) { return apiError(error instanceof Error ? error.message : "ویرایش ناموفق بود", 422); } }
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const gate = await assertAdminApi(); if ("error" in gate) return gate.error; try { const { id } = await params; await deleteAdminNote(id); return apiSuccess({ message: "یادداشت حذف شد" }); } catch (error) { return apiError(error instanceof Error ? error.message : "حذف ناموفق بود", 404); } }
