import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentlyReadingBooks } from "@/lib/reading/service";
import { getLibraryPath } from "@/lib/library/paths";
import CurrentlyReadingPage from "@/components/reading/CurrentlyReadingPage";

export const dynamic = "force-dynamic";

export default async function ReadingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const books = await getCurrentlyReadingBooks(user.id);
  return <CurrentlyReadingPage initialBooks={books} libraryHref={getLibraryPath(user.username)} />;
}
