-- Changes only the default used by future inserts. Existing rows and their
-- current PUBLIC/PRIVATE preference are intentionally untouched.
ALTER TABLE "User"
  ALTER COLUMN "profile_visibility" SET DEFAULT 'PUBLIC';
