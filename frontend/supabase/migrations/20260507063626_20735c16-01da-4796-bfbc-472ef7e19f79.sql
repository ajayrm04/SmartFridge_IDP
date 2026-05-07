
-- Sensor readings (time-series)
CREATE TABLE public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  zone_id TEXT NOT NULL DEFAULT 'main',
  temperature NUMERIC NOT NULL,
  humidity NUMERIC NOT NULL,
  ammonia NUMERIC NOT NULL DEFAULT 0,
  co2 NUMERIC NOT NULL DEFAULT 400,
  ethylene NUMERIC NOT NULL DEFAULT 0,
  energy_w NUMERIC NOT NULL DEFAULT 0,
  compressor_on BOOLEAN NOT NULL DEFAULT false,
  fan_on BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.sensor_readings (created_at DESC);
CREATE INDEX ON public.sensor_readings (zone_id, created_at DESC);

CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  zone_id TEXT NOT NULL DEFAULT 'main',
  stored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  base_shelf_life_hours NUMERIC NOT NULL,
  activation_energy_kj NUMERIC NOT NULL,
  spoilage_pct NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.alerts (created_at DESC);

CREATE TABLE public.control_logs (
  id BIGSERIAL PRIMARY KEY,
  prev_temp NUMERIC,
  target_temp NUMERIC,
  cooling_level NUMERIC,
  pid_output NUMERIC,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_recommendations (
  id BIGSERIAL PRIMARY KEY,
  recommendation TEXT NOT NULL,
  related_item TEXT,
  severity TEXT NOT NULL DEFAULT 'INFO',
  generated_from TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  target_temp NUMERIC NOT NULL DEFAULT 4,
  kp NUMERIC NOT NULL DEFAULT 2.0,
  ki NUMERIC NOT NULL DEFAULT 0.1,
  kd NUMERIC NOT NULL DEFAULT 0.5,
  manual_override BOOLEAN NOT NULL DEFAULT false,
  fan_manual BOOLEAN NOT NULL DEFAULT false,
  compressor_manual BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.system_settings (id) VALUES (1);

-- Demo: public read/write (no auth in v1)
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public all" ON public.sensor_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.food_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.control_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.ai_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed food items
INSERT INTO public.food_items (name, category, zone_id, base_shelf_life_hours, activation_energy_kj) VALUES
  ('Whole Milk', 'dairy', 'top', 168, 80),
  ('Greek Yogurt', 'dairy', 'top', 240, 75),
  ('Strawberries', 'fruits', 'crisper', 96, 90),
  ('Spinach', 'vegetables', 'crisper', 120, 85),
  ('Chicken Breast', 'meat', 'main', 72, 95),
  ('Salmon Fillet', 'meat', 'main', 48, 100),
  ('Apples', 'fruits', 'door', 336, 70);
