ALTER TABLE public.food_items
ADD COLUMN IF NOT EXISTS scanned_expiry_at TIMESTAMPTZ;

UPDATE public.food_items
SET scanned_expiry_at = scanned_expiry_date::timestamp
WHERE scanned_expiry_date IS NOT NULL
  AND scanned_expiry_at IS NULL;
