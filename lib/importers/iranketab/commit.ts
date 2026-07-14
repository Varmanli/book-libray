import { and, eq, or, sql } from "drizzle-orm";
import type { IranKetabExtractionEnvelope } from "@ghafaseh/iranketab-extractor";
import { db } from "@/db";
import {
  BookEdition,
  BookExternalLink,
  CatalogBook,
  ReferenceItem,
} from "@/db/schema";
import { generateUniqueCatalogBookSlug } from "@/lib/book/public-slug";
import { sanitizeRichTextHtml } from "@/lib/content/rich-text";
import { joinPeople, normalizeIsbn } from "@/lib/books/import/normalize";
import {
  draftFingerprint,
  isOwnedTemporaryCoverKey,
  type IranKetabImportDraftWithPreparedCovers,
} from "./cover-preparation";
import {
  copyImageUpload,
  deleteImageUpload,
  headImageUpload,
} from "@/lib/server/upload-storage";
import {
  createReferenceResolutionCache,
  resolveReferenceItem,
} from "@/lib/reference/service";
import { applyExplicitFields } from "./field-actions";
import {
  applyRelationDiff,
  diffRelations,
  editionFieldPatch,
  splitRelations,
} from "./hardening";
import { iranKetabImportDraftSchema } from "./draft";
import { extractionCollectionLimitIssues, formatIranKetabSchemaIssues, IRANKETAB_COLLECTION_LIMITS } from "./collection-limits";
import { finalIranKetabCoverValue } from "./repair-cover-paths";
import {
  advisoryLockKey,
  canonicalIranKetabSourceIdentity,
} from "./server-hardening";

export type IranKetabCommitErrorCode =
  | "INVALID_DRAFT"
  | "STALE_DRAFT"
  | "ISBN_CONFLICT"
  | "SOURCE_URL_CONFLICT"
  | "SOURCE_EDITION_CONFLICT"
  | "ENTITY_AMBIGUOUS"
  | "COVER_PROMOTION_FAILED"
  | "DATABASE_TRANSACTION_FAILED"
  | "IMPORT_ALREADY_COMPLETED"
  | "CONCURRENT_IMPORT_CONFLICT";
export const IRANKETAB_COMMIT_ERROR_MESSAGES: Record<
  IranKetabCommitErrorCode,
  string
> = {
  INVALID_DRAFT: "پیش‌نویس ورود معتبر نیست.",
  STALE_DRAFT: "پیش‌نویس تغییر کرده است؛ دوباره اعتبارسنجی کنید.",
  ISBN_CONFLICT: "شابک انتخاب‌شده متعلق به نسخه دیگری است.",
  SOURCE_URL_CONFLICT: "لینک ایران‌کتاب متعلق به کتاب دیگری است.",
  SOURCE_EDITION_CONFLICT: "کد نسخه ایران‌کتاب متعلق به نسخه دیگری است.",
  ENTITY_AMBIGUOUS: "یکی از مراجع چند تطابق احتمالی دارد.",
  COVER_PROMOTION_FAILED: "انتقال کاور کامل نشد؛ دوباره آماده‌سازی کنید.",
  DATABASE_TRANSACTION_FAILED: "ثبت تراکنشی اطلاعات انجام نشد.",
  IMPORT_ALREADY_COMPLETED: "این ورود قبلاً تکمیل شده است.",
  CONCURRENT_IMPORT_CONFLICT: "ورود هم‌زمان دیگری در حال انجام است.",
};
export class IranKetabCommitError extends Error {
  constructor(
    public readonly code: IranKetabCommitErrorCode,
    message = IRANKETAB_COMMIT_ERROR_MESSAGES[code],
  ) {
    super(message);
    this.name = "IranKetabCommitError";
  }
}
export async function commitIranKetabImport(params: {
  adminId: string;
  extraction: IranKetabExtractionEnvelope;
  prepared: IranKetabImportDraftWithPreparedCovers;
}) {
  const { draft, fingerprint, preparedCovers } = params.prepared;
  const extractionLimitIssues = extractionCollectionLimitIssues(params.extraction);
  if (extractionLimitIssues.length) throw new IranKetabCommitError("INVALID_DRAFT", extractionLimitIssues.join(" "));
  if (preparedCovers.length > IRANKETAB_COLLECTION_LIMITS.editions) throw new IranKetabCommitError("INVALID_DRAFT", `تعداد «کاورهای آماده‌شده» ${preparedCovers.length.toLocaleString("fa-IR")} مورد است؛ حداکثر مجاز ${IRANKETAB_COLLECTION_LIMITS.editions.toLocaleString("fa-IR")} مورد است.`);
  const parsedDraft = iranKetabImportDraftSchema.safeParse(draft);
  if (!parsedDraft.success) throw new IranKetabCommitError("INVALID_DRAFT", formatIranKetabSchemaIssues(parsedDraft.error).join(" "));
  if (
    draftFingerprint(draft) !== fingerprint ||
    draft.source.canonicalUrl !== params.extraction.source.canonicalUrl ||
    draft.source.selectedEditionCode !== params.extraction.source.editionCode
  )
    throw new IranKetabCommitError(
      "STALE_DRAFT",
      "پیش‌نویس یا رسانه‌های آماده‌شده دیگر معتبر نیستند.",
    );
  if (
    draft.entities.some((x) => x.action === "UNRESOLVED") ||
    draft.unresolvedIssues.some((x) => x.blocking)
  )
    throw new IranKetabCommitError(
      "INVALID_DRAFT",
      "تعارض یا مرجع حل‌نشده وجود دارد.",
    );
  const promoted: string[] = [];
  const coverUrls = new Map<number, string>();
  const promoteCovers = async () => {
    try {
      for (const preparedCover of preparedCovers.filter(
        (item) => item.status === "PREPARED",
      )) {
        if (
          !preparedCover.objectKey ||
          !isOwnedTemporaryCoverKey(
            preparedCover.objectKey,
            params.adminId,
            fingerprint,
          )
        )
          throw new IranKetabCommitError(
            "STALE_DRAFT",
            "کاور موقت قابل تأیید نیست.",
          );
        const finalKey = `covers/iranketab-${fingerprint.slice(0, 20)}-${preparedCover.extractedEditionIndex}.webp`;
        const prior = await headImageUpload(finalKey);
        const metadata = await headImageUpload(preparedCover.objectKey);
        if (
          !prior &&
          (!metadata ||
            metadata.contentType !== "image/webp" ||
            metadata.sizeBytes < 1 ||
            metadata.sizeBytes > 10 * 1024 * 1024 ||
            metadata.metadata["iranketab-admin"] !== params.adminId ||
            metadata.metadata["iranketab-fingerprint"] !== fingerprint ||
            metadata.metadata["iranketab-edition-index"] !==
              String(preparedCover.extractedEditionIndex))
        )
          throw new IranKetabCommitError(
            "STALE_DRAFT",
            "کاور آماده‌شده نیازمند آماده‌سازی مجدد است.",
          );
        if (!prior) {
          await copyImageUpload({
            sourceKey: preparedCover.objectKey,
            destinationKey: finalKey,
            contentType: "image/webp",
            metadata: {
              "iranketab-fingerprint": fingerprint,
              "iranketab-edition-index": String(
                preparedCover.extractedEditionIndex,
              ),
            },
          });
          promoted.push(finalKey);
        } else if (prior.metadata["iranketab-fingerprint"] !== fingerprint) {
          throw new IranKetabCommitError(
            "COVER_PROMOTION_FAILED",
            "مقصد کاور با ورود دیگری تداخل دارد.",
          );
        }
        const finalMetadata = await headImageUpload(finalKey);
        if (
          !finalMetadata ||
          finalMetadata.contentType !== "image/webp" ||
          finalMetadata.sizeBytes < 1
        )
          throw new IranKetabCommitError(
            "COVER_PROMOTION_FAILED",
            "تأیید کاور نهایی ناموفق بود.",
          );
        // Persist the canonical Arvan object key. Display code resolves this
        // key to S3_PUBLIC_BASE_URL; /uploads is reserved for real local files.
        coverUrls.set(preparedCover.extractedEditionIndex, finalIranKetabCoverValue(finalKey));
      }
    } catch (error) {
      await Promise.all(
        promoted.map((key) => deleteImageUpload(key).catch(() => undefined)),
      );
      if (error instanceof IranKetabCommitError) throw error;
      throw new IranKetabCommitError(
        "COVER_PROMOTION_FAILED",
        "انتقال امن کاور به فضای نهایی ناموفق بود.",
      );
    }
  };
  let result;
  try {
    result = await db.transaction(async (tx) => {
      const identity = canonicalIranKetabSourceIdentity(
        draft.source.canonicalUrl,
      );
      await tx.execute(
        sql`select pg_advisory_xact_lock(${advisoryLockKey(identity)})`,
      );
      const requestedIsbns = draft.editions
        .flatMap((item) =>
          item.action === "CREATE_NEW"
            ? [
                normalizeIsbn(item.fields.isbn10),
                normalizeIsbn(item.fields.isbn13),
              ]
            : [],
        )
        .filter((value): value is string => Boolean(value));
      for (const isbn of [...new Set(requestedIsbns)].sort())
        await tx.execute(
          sql`select pg_advisory_xact_lock(${advisoryLockKey(`isbn:${isbn}`)})`,
        );
      const sourceCodes = draft.editions.flatMap((item) =>
        item.action === "CREATE_NEW" ? [item.fields.sourceEditionCode] : [],
      );
      for (const code of [...new Set(sourceCodes)].sort())
        await tx.execute(
          sql`select pg_advisory_xact_lock(${advisoryLockKey(`source-edition:${code}`)})`,
        );
      const existingLinks = await tx
        .select({
          catalogBookId: BookExternalLink.catalogBookId,
          url: BookExternalLink.url,
        })
        .from(BookExternalLink)
        .where(eq(BookExternalLink.provider, "iranketab"));
      const linked = existingLinks.find((item) => {
        try {
          return canonicalIranKetabSourceIdentity(item.url) === identity;
        } catch {
          return false;
        }
      });
      if (
        linked &&
        draft.catalog.action === "REUSE_EXISTING" &&
        linked.catalogBookId !== draft.catalog.catalogId
      )
        throw new IranKetabCommitError(
          "SOURCE_URL_CONFLICT",
          "این لینک ایران‌کتاب به کتاب دیگری متصل است.",
        );
      await promoteCovers();
      const entityResult = {
        created: [] as Array<{ entityType: string; id: string; name: string }>,
        reused: [] as Array<{ entityType: string; id: string; name: string }>,
      };
      const referenceCache = createReferenceResolutionCache();
      for (const entity of draft.entities) {
        if (entity.action === "REUSE_EXISTING") {
          const [row] = await tx
            .select({
              id: ReferenceItem.id,
              name: ReferenceItem.name,
              type: ReferenceItem.type,
            })
            .from(ReferenceItem)
            .where(eq(ReferenceItem.id, entity.entityId))
            .limit(1);
          if (!row || row.type !== entity.entityType)
            throw new IranKetabCommitError(
              "STALE_DRAFT",
              "یکی از مراجع انتخاب‌شده تغییر کرده است.",
            );
          entityResult.reused.push({
            entityType: row.type,
            id: row.id,
            name: row.name,
          });
        } else if (entity.action === "CREATE_NEW") {
          const resolved = await resolveReferenceItem(tx, {
            type: entity.entityType,
            input: { name: entity.proposedName },
            cache: referenceCache,
            createdById: params.adminId,
            defaultStatus: "APPROVED",
          });
          if (!resolved)
            throw new IranKetabCommitError(
              "INVALID_DRAFT",
              "نام مرجع معتبر نیست.",
            );
          entityResult[
            resolved.resolution === "created" ? "created" : "reused"
          ].push({
            entityType: entity.entityType,
            id: resolved.id,
            name: resolved.name,
          });
        }
      }
      let catalogId: string;
      let catalogTitle: string;
      let catalogAction: "CREATED" | "REUSED" | "UPDATED" = "REUSED";
      if (draft.catalog.action === "REUSE_EXISTING") {
        const [row] = await tx
          .select({
            id: CatalogBook.id,
            title: CatalogBook.title,
            subtitle: CatalogBook.subtitle,
            originalTitle: CatalogBook.originalTitle,
            description: CatalogBook.description,
            language: CatalogBook.language,
            firstPublishedYear: CatalogBook.firstPublishedYear,
            author: CatalogBook.author,
            genre: CatalogBook.genre,
          })
          .from(CatalogBook)
          .where(eq(CatalogBook.id, draft.catalog.catalogId))
          .limit(1);
        if (!row)
          throw new IranKetabCommitError(
            "STALE_DRAFT",
            "کتاب انتخاب‌شده دیگر وجود ندارد.",
          );
        const source = {
          subtitle: params.extraction.book.subtitle,
          originalTitle: params.extraction.book.originalTitle,
          description: sanitizeRichTextHtml(params.extraction.book.description),
          language: params.extraction.book.language,
          firstPublishedYear: params.extraction.book.firstPublishedYear,
        };
        const patch = applyExplicitFields(
          row,
          draft.catalog.fieldActions,
          source,
        );
        const relationName = (item: (typeof draft.catalog.authors)[number]) =>
          item.action === "REUSE_EXISTING"
            ? item.displayName
            : item.action === "CREATE_NEW"
              ? item.proposedName
              : item.extractedName;
        const authors = applyRelationDiff(
          diffRelations(
            splitRelations(row.author),
            draft.catalog.authors.map(relationName),
          ),
          { requireOne: true },
        ).join("، ");
        const genres =
          applyRelationDiff(
            diffRelations(
              splitRelations(row.genre),
              draft.catalog.genres.map(relationName),
            ),
          ).join("، ") || null;
        if (authors !== row.author) patch.author = authors;
        if (genres !== row.genre) patch.genre = genres;
        if (Object.keys(patch).length) {
          await tx
            .update(CatalogBook)
            .set({ ...patch, updatedAt: new Date() })
            .where(eq(CatalogBook.id, row.id));
          catalogAction = "UPDATED";
        }
        catalogId = row.id;
        catalogTitle = (patch.title as string | undefined) ?? row.title;
      } else {
        const [bySource] = await tx
          .select({ id: CatalogBook.id, title: CatalogBook.title })
          .from(CatalogBook)
          .where(
            linked
              ? eq(CatalogBook.id, linked.catalogBookId)
              : eq(CatalogBook.sourceUrl, draft.source.canonicalUrl),
          )
          .limit(1);
        if (bySource) {
          catalogId = bySource.id;
          catalogTitle = bySource.title;
        } else {
          const id = crypto.randomUUID();
          const slug = await generateUniqueCatalogBookSlug(
            draft.catalog.fields.title,
            id,
          );
          const [created] = await tx
            .insert(CatalogBook)
            .values({
              id,
              slug,
              title: draft.catalog.fields.title.trim(),
              subtitle: draft.catalog.fields.subtitle,
              originalTitle: draft.catalog.fields.originalTitle,
              description: sanitizeRichTextHtml(
                draft.catalog.fields.description,
              ),
              author: joinPeople(
                draft.catalog.authors.map((x) => ({
                  name:
                    x.action === "REUSE_EXISTING"
                      ? x.displayName
                      : x.action === "CREATE_NEW"
                        ? x.proposedName
                        : x.extractedName,
                })),
              ),
              genre: joinPeople(
                draft.catalog.genres.map((x) => ({
                  name:
                    x.action === "REUSE_EXISTING"
                      ? x.displayName
                      : x.action === "CREATE_NEW"
                        ? x.proposedName
                        : x.extractedName,
                })),
              ),
              country: draft.catalog.country
                ? draft.catalog.country.action === "REUSE_EXISTING"
                  ? draft.catalog.country.displayName
                  : draft.catalog.country.action === "CREATE_NEW"
                    ? draft.catalog.country.proposedName
                    : null
                : null,
              language: draft.catalog.fields.language,
              firstPublishedYear: draft.catalog.fields.firstPublishedYear,
              sourceName: "iranketab",
              sourceUrl: draft.source.canonicalUrl,
              status: "APPROVED",
              createdById: params.adminId,
            })
            .returning({ id: CatalogBook.id, title: CatalogBook.title });
          catalogId = created.id;
          catalogTitle = created.title;
          catalogAction = "CREATED";
        }
      }
      const editions: Array<{
        extractedEditionIndex: number;
        action: string;
        editionId?: string;
        catalogId?: string;
        coverAction: string;
      }> = [];
      for (const decision of draft.editions) {
        if (decision.action === "EXCLUDE") {
          editions.push({
            extractedEditionIndex: decision.extractedEditionIndex,
            action: "EXCLUDED",
            coverAction: "SKIPPED",
          });
          continue;
        }
        const source =
          params.extraction.editions[decision.extractedEditionIndex];
        if (!source)
          throw new IranKetabCommitError(
            "INVALID_DRAFT",
            "نسخه منبع معتبر نیست.",
          );
        if (decision.action === "REUSE_EXISTING") {
          const [existing] = await tx
            .select({
              id: BookEdition.id,
              catalogBookId: BookEdition.catalogBookId,
              titleOverride: BookEdition.titleOverride,
              publisher: BookEdition.publisher,
              translators: BookEdition.translator,
              isbn10: BookEdition.isbn10,
              isbn13: BookEdition.isbn13,
              publishedYear: BookEdition.publishedYear,
              pageCount: BookEdition.pageCount,
              editionDescription: BookEdition.editionDescription,
              coverImage: BookEdition.coverImage,
            })
            .from(BookEdition)
            .where(eq(BookEdition.id, decision.editionId))
            .limit(1);
          if (!existing || existing.catalogBookId !== catalogId)
            throw new IranKetabCommitError(
              "STALE_DRAFT",
              "نسخه انتخاب‌شده با کتاب سازگار نیست.",
            );
          const sourceFields = {
            titleOverride: source.titleOverride || null,
            publisher: source.publisher.name || null,
            translators: joinPeople(source.translators),
            isbn10: normalizeIsbn(source.isbn10),
            isbn13: normalizeIsbn(source.isbn13),
            publishedYear: source.publishedYear,
            pageCount: source.pageCount,
            editionDescription: sanitizeRichTextHtml(source.editionDescription),
          };
          const patch = editionFieldPatch(
            existing,
            sourceFields,
            decision.fieldActions,
          );
          const selectedCover = coverUrls.get(decision.extractedEditionIndex);
          const coverPatch =
            decision.coverAction.action === "IMPORT_SOURCE" &&
            selectedCover &&
            selectedCover !== existing.coverImage
              ? { coverImage: selectedCover, coverFilename: "cover.webp" }
              : {};
          const changed =
            Object.keys(patch).length > 0 || Object.keys(coverPatch).length > 0;
          if (changed) {
            const update = { ...patch, ...coverPatch, updatedAt: new Date() };
            await tx
              .update(BookEdition)
              .set(update)
              .where(eq(BookEdition.id, existing.id));
          }
          editions.push({
            extractedEditionIndex: decision.extractedEditionIndex,
            action: changed ? "UPDATED" : "REUSED",
            editionId: existing.id,
            catalogId,
            coverAction: Object.keys(coverPatch).length
              ? "ATTACHED"
              : decision.coverAction.action === "KEEP_EXISTING"
                ? "KEPT"
                : "SKIPPED",
          });
          continue;
        }
        const isbn13 = normalizeIsbn(decision.fields.isbn13);
        const isbn10 = normalizeIsbn(decision.fields.isbn10);
        const [sameSource] = await tx
          .select({
            id: BookEdition.id,
            catalogBookId: BookEdition.catalogBookId,
          })
          .from(BookEdition)
          .where(
            and(
              eq(BookEdition.sourceName, "iranketab"),
              eq(
                BookEdition.sourceEditionCode,
                decision.fields.sourceEditionCode,
              ),
            ),
          )
          .limit(1);
        if (sameSource) {
          if (sameSource.catalogBookId !== catalogId)
            throw new IranKetabCommitError(
              "SOURCE_EDITION_CONFLICT",
              "کد نسخه ایران‌کتاب به نسخه دیگری متصل است.",
            );
          editions.push({
            extractedEditionIndex: decision.extractedEditionIndex,
            action: "REUSED",
            editionId: sameSource.id,
            catalogId,
            coverAction: "SKIPPED",
          });
          continue;
        }
        const isbnConditions = [isbn10, isbn13]
          .filter((value): value is string => Boolean(value))
          .flatMap((value) => [
            eq(BookEdition.isbn10, value),
            eq(BookEdition.isbn13, value),
          ]);
        if (isbnConditions.length) {
          const [isbnOwner] = await tx
            .select({ id: BookEdition.id })
            .from(BookEdition)
            .where(or(...isbnConditions))
            .limit(1);
          if (isbnOwner)
            throw new IranKetabCommitError(
              "ISBN_CONFLICT",
              "شابک انتخاب‌شده قبلاً برای نسخه دیگری ثبت شده است.",
            );
        }
        const coverImage =
          coverUrls.get(decision.extractedEditionIndex) ?? null;
        const [created] = await tx
          .insert(BookEdition)
          .values({
            id: crypto.randomUUID(),
            catalogBookId: catalogId,
            titleOverride: decision.fields.titleOverride,
            translator: joinPeople(
              decision.translators.map((x) => ({
                name:
                  x.action === "REUSE_EXISTING"
                    ? x.displayName
                    : x.action === "CREATE_NEW"
                      ? x.proposedName
                      : x.extractedName,
              })),
            ),
            publisher: decision.publisher
              ? decision.publisher.action === "REUSE_EXISTING"
                ? decision.publisher.displayName
                : decision.publisher.action === "CREATE_NEW"
                  ? decision.publisher.proposedName
                  : null
              : null,
            isbn: isbn13 ?? isbn10,
            isbn10,
            isbn13,
            format: "PHYSICAL",
            coverImage,
            coverFilename: coverImage ? "cover.webp" : null,
            publishedYear: decision.fields.publishedYear,
            editionDescription: decision.fields.editionDescription,
            pageCount: decision.fields.pageCount,
            language:
              draft.catalog.action === "CREATE_NEW"
                ? draft.catalog.fields.language
                : params.extraction.book.language,
            sourceName: "iranketab",
            sourceUrl: source.sourceUrl,
            sourceEditionCode: source.sourceEditionCode,
            status: "APPROVED",
            createdById: params.adminId,
          })
          .returning({ id: BookEdition.id });
        editions.push({
          extractedEditionIndex: decision.extractedEditionIndex,
          action: "CREATED",
          editionId: created.id,
          catalogId,
          coverAction: coverImage ? "ATTACHED" : "SKIPPED",
        });
      }
      if (!linked)
        await tx.insert(BookExternalLink).values({
          catalogBookId: catalogId,
          provider: "iranketab",
          label: "ایران‌کتاب",
          url: draft.source.canonicalUrl,
          type: "print",
          isActive: true,
          sortOrder: 0,
        });
      const [catalog] = await tx
        .select({ primaryEditionId: CatalogBook.primaryEditionId })
        .from(CatalogBook)
        .where(eq(CatalogBook.id, catalogId));
      const first = editions.find((x) => x.action === "CREATED")?.editionId;
      if (!catalog?.primaryEditionId && first)
        await tx
          .update(CatalogBook)
          .set({ primaryEditionId: first, updatedAt: new Date() })
          .where(eq(CatalogBook.id, catalogId));
      return {
        catalog: { action: catalogAction, id: catalogId, title: catalogTitle },
        editions,
        entities: entityResult,
      };
    });
  } catch (error) {
    await Promise.all(
      promoted.map((key) => deleteImageUpload(key).catch(() => undefined)),
    );
    if (error instanceof IranKetabCommitError) throw error;
    throw new IranKetabCommitError(
      "DATABASE_TRANSACTION_FAILED",
      "تراکنش ثبت کتاب انجام نشد.",
    );
  }
  const cleanupWarnings: string[] = [];
  for (const preparedCover of preparedCovers)
    if (preparedCover.status === "PREPARED" && preparedCover.objectKey)
      try {
        await deleteImageUpload(preparedCover.objectKey);
      } catch {
        cleanupWarnings.push(
          "پاک‌سازی یکی از کاورهای موقت بعد از ثبت ناموفق بود.",
        );
      }
  return { ...result, warnings: cleanupWarnings };
}
