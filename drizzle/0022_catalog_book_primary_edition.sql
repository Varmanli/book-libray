alter table "CatalogBook"
  add column "primary_edition_id" varchar;

alter table "CatalogBook"
  add constraint "CatalogBook_primary_edition_id_BookEdition_id_fk"
  foreign key ("primary_edition_id")
  references "public"."BookEdition"("id")
  on delete set null
  on update no action;
