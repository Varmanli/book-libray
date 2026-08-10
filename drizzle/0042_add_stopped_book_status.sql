-- PostgreSQL enum changes are additive. Existing Book rows and the legacy
-- PAUSED status remain untouched; this only makes STOPPED a valid new value.
ALTER TYPE "public"."BookStatus" ADD VALUE IF NOT EXISTS 'STOPPED' BEFORE 'FINISHED';
