import { slugifyBookTitle, slugifyPersonName, slugifyPublisherName } from "./slug.js";

export function buildCoverFilename(input: {
  bookSlug: string;
  publisherName: string;
  translatorNames: string[];
  sourceEditionCode: string;
  usedFilenames: Set<string>;
}): string {
  const bookSlug = slugifyBookTitle(input.bookSlug);
  const publisherSlug = slugifyPublisherName(input.publisherName || "unknown-publisher");
  const translatorSlug =
    input.translatorNames.length > 0
      ? input.translatorNames.map((name) => slugifyPersonName(name)).join("-")
      : "unknown-translator";
  const base = `${bookSlug}-${publisherSlug}-${translatorSlug}`.replace(/-+/g, "-");
  let filename = `${base}.jpg`;

  if (input.usedFilenames.has(filename)) {
    filename = `${base}-${input.sourceEditionCode}.jpg`;
  }

  input.usedFilenames.add(filename);
  return filename;
}




