-- PublishedBookNote.content is PostgreSQL text and already preserves existing
-- values. This additive, NOT VALID constraint applies the same generous upper
-- bound as the API to future inserts and updates without scanning or changing
-- existing rows.
ALTER TABLE "PublishedBookNote"
  ADD CONSTRAINT "PublishedBookNote_content_length_check"
  CHECK (char_length("content") <= 50000) NOT VALID;
