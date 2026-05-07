ALTER TABLE public.food_items
ADD COLUMN IF NOT EXISTS scanned_expiry_date DATE;
