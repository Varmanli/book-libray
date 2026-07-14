import type { GhafasehBookImport, GhafasehEdition } from "./contract.js";
import { buildCoverFilename } from "./filename.js";
import { KNOWN_TRANSLATORS, KNOWN_PUBLISHERS, toCountry } from "./known-entities.js";
import { normalizePersianText, slugifyPersonName, slugifyPublisherName } from "./slug.js";

export function normalizeEditionIsbn(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d]/g, "");
  return normalized || null;
}

export function normalizeEditions(book: GhafasehBookImport, bookSlug: string): GhafasehEdition[] {
  const usedFilenames = new Set<string>();

  return book.editions.map((edition) => {
    const publisherName = normalizePersianText(edition.publisher.name);
    const knownPublisher = KNOWN_PUBLISHERS.get(publisherName);
    const publisherSlug = knownPublisher?.slug ?? slugifyPublisherName(publisherName);
    const translators = edition.translators.map((translator) => {
      const known = KNOWN_TRANSLATORS.get(normalizePersianText(translator.name));
      return {
        ...translator,
        name: normalizePersianText(translator.name),
        slug: known?.slug ?? slugifyPersonName(translator.name),
        country: known?.country ? toCountry(known.country) : translator.country
      };
    });

    const cleanDescription = edition.editionDescription
      ?.replace(/نشر نشر /g, "نشر ")
      .replace(/جلد جلد سخت/g, "جلد سخت")
      ?? null;

    return {
      ...edition,
      titleOverride: normalizePersianText(edition.titleOverride),
      isbn13: normalizeEditionIsbn(edition.isbn13),
      publisher: {
        name: knownPublisher?.name ?? publisherName,
        slug: publisherSlug
      },
      translators,
      editionDescription: cleanDescription,
      coverFilename: buildCoverFilename({
        bookSlug,
        publisherName,
        translatorNames: translators.map((translator) => translator.name),
        sourceEditionCode: edition.sourceEditionCode,
        usedFilenames
      })
    };
  });
}




