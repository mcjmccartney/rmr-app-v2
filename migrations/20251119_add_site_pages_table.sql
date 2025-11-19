-- Migration: add site_pages table for editable site pages
-- Run this against your Supabase/Postgres database

CREATE TABLE IF NOT EXISTS site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text,
  html_content text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: index for quick slug lookups
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug);
