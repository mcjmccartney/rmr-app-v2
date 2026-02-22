-- Migration: Update all Service Agreement titles to "Booking Terms & Service Agreement"
-- Run this in your Supabase SQL Editor

-- Update all existing booking terms versions that have "Service Agreement" in the title
-- to use "Booking Terms & Service Agreement" instead

UPDATE booking_terms_versions
SET title = 'Booking Terms & Service Agreement'
WHERE title LIKE 'Service Agreement%';

-- Update the updated_at timestamp
UPDATE booking_terms_versions
SET updated_at = NOW()
WHERE title = 'Booking Terms & Service Agreement';

