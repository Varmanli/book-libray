# Primary-edition integrity operations

The primary-edition endpoint only updates `CatalogBook.primary_edition_id`. It
does not call import, deduplication, cleanup, merge, deletion, or edition
reassignment code.

## Production diagnostics

Inspect the production schema first (the supplied repair script does this
before it runs any diagnostic or repair query):

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('CatalogBook', 'BookEdition')
ORDER BY table_name, ordinal_position;
```

Cross-book primary pointers:

```sql
SELECT cb.id AS catalog_book_id, cb.title AS catalog_book_title,
       cb.primary_edition_id, be.catalog_book_id AS actual_edition_parent,
       parent.title AS actual_parent_title
FROM "CatalogBook" cb
JOIN "BookEdition" be ON be.id = cb.primary_edition_id
JOIN "CatalogBook" parent ON parent.id = be.catalog_book_id
WHERE be.catalog_book_id <> cb.id;
```

Missing primary targets:

```sql
SELECT cb.id, cb.title, cb.primary_edition_id
FROM "CatalogBook" cb
LEFT JOIN "BookEdition" be ON be.id = cb.primary_edition_id
WHERE cb.primary_edition_id IS NOT NULL AND be.id IS NULL;
```

Recent edition-parent changes:

```sql
SELECT id, title_override, catalog_book_id, created_at, updated_at
FROM "BookEdition"
ORDER BY updated_at DESC NULLS LAST
LIMIT 100;
```

Potential duplicate catalog records (report only):

```sql
SELECT lower(trim(title)) AS normalized_title, lower(trim(author)) AS normalized_author,
       count(*) AS catalog_book_count, array_agg(id ORDER BY id) AS catalog_book_ids
FROM "CatalogBook"
GROUP BY lower(trim(title)), lower(trim(author))
HAVING count(*) > 1;
```

## Safe repair

`npm run primary-edition:inspect` is dry-run only. It reports cross-book and
missing pointers, recent editions, and possible duplicate CatalogBooks. It
does not delete, merge, or move any records.

After reviewing that output, `npm run primary-edition:repair` (the explicit
`--apply` mode) clears only invalid `primary_edition_id` values. Re-running it
is idempotent. It never deletes or merges CatalogBooks/BookEditions.
