import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Legacy profile route. Profiles now live at the root `/[username]`; keep this
 * as a permanent (308) redirect so old `/u/<username>` links keep working.
 */
export default async function LegacyProfileRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  permanentRedirect(`/${encodeURIComponent(username)}`);
}
