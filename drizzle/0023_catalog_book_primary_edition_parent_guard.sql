-- A foreign key confirms that the edition exists, but cannot confirm that it
-- belongs to the same CatalogBook.  These deferred constraint triggers enforce
-- that cross-table ownership invariant for every database write path.

CREATE OR REPLACE FUNCTION public.assert_catalog_book_primary_edition_parent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."primary_edition_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public."BookEdition" be
    WHERE be."id" = NEW."primary_edition_id"
      AND be."catalog_book_id" = NEW."id"
  ) THEN
    RAISE EXCEPTION
      'CatalogBook.primary_edition_id must belong to the same CatalogBook'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_book_edition_primary_parent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."CatalogBook" cb
    WHERE cb."primary_edition_id" = NEW."id"
      AND cb."id" <> NEW."catalog_book_id"
  ) THEN
    RAISE EXCEPTION
      'A primary BookEdition cannot be moved to another CatalogBook'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "CatalogBook_primary_edition_parent_guard" ON public."CatalogBook";
CREATE CONSTRAINT TRIGGER "CatalogBook_primary_edition_parent_guard"
AFTER INSERT OR UPDATE OF "id", "primary_edition_id" ON public."CatalogBook"
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW EXECUTE FUNCTION public.assert_catalog_book_primary_edition_parent();

DROP TRIGGER IF EXISTS "BookEdition_primary_parent_guard" ON public."BookEdition";
CREATE CONSTRAINT TRIGGER "BookEdition_primary_parent_guard"
AFTER UPDATE OF "id", "catalog_book_id" ON public."BookEdition"
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW EXECUTE FUNCTION public.assert_book_edition_primary_parent();
