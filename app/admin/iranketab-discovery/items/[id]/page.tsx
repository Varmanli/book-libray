import IranKetabDiscoveryCandidateDetailClient from "@/components/admin/IranKetabDiscoveryCandidateDetailClient";

export const dynamic = "force-dynamic";

export default async function IranKetabDiscoveryCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  return <IranKetabDiscoveryCandidateDetailClient id={(await params).id} />;
}
