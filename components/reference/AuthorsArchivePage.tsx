import ReferenceArchivePage from "@/components/reference/ReferenceArchivePage";
import type { ReferenceSearchPage } from "@/lib/reference/service";

export default function AuthorsArchivePage({
  initialQuery,
  result,
}: {
  initialQuery: string;
  result: ReferenceSearchPage;
}) {
  return (
    <ReferenceArchivePage
      initialQuery={initialQuery}
      result={result}
      routeBase="/authors"
      searchPlaceholder="جستجو در نویسنده‌ها..."
      emptyTitle="نویسنده‌ای پیدا نشد"
    />
  );
}
