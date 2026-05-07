import { createServerFn } from "@tanstack/react-start";
import { spoilageDelta, remainingHours, arrheniusRate, humidityFactor, pidStep } from "@/lib/spoilage";


// ---- Simulated reading generator (when no ESP32 is sending data) ----
// Random walk anchored to target temp from system_settings, with PID-controlled compressor.
let simState = {
  temp: 6.5,
  rh: 70,
  ammonia: 0.4,
  co2: 480,
  ethylene: 1.2,
  pid: { integral: 0, lastError: 0 },
};

async function generateReading() {
  const { data: settings } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin
    .from("system_settings").select("*").eq("id", 1).single();
  const target = settings?.target_temp ?? 4;

  // PID
  const { output, state } = pidStep(
    simState.temp, target, simState.pid,
    { kp: settings?.kp ?? 2, ki: settings?.ki ?? 0.1, kd: settings?.kd ?? 0.5 },
    0.5
  );
  simState.pid = state;
  const compressorOn = settings?.manual_override ? !!settings.compressor_manual : output > 25;
  const fanOn = settings?.manual_override ? !!settings.fan_manual : output > 10;

  // Temp dynamics
  const cooling = compressorOn ? -0.35 : 0;
  const ambientLeak = 0.18;
  simState.temp += cooling + ambientLeak + (Math.random() - 0.5) * 0.2;
  simState.rh += (Math.random() - 0.48) * 1.2;
  simState.rh = Math.max(45, Math.min(92, simState.rh));
  simState.ammonia = Math.max(0, simState.ammonia + (Math.random() - 0.5) * 0.05);
  simState.co2 = 10000;
  simState.ethylene = Math.max(0, simState.ethylene + (Math.random() - 0.48) * 0.3);

  const energy = (compressorOn ? 110 : 8) + (fanOn ? 12 : 0) + Math.random() * 4;

  return {
    temperature: +simState.temp.toFixed(2),
    humidity: +simState.rh.toFixed(1),
    ammonia: +simState.ammonia.toFixed(3),
    co2: +simState.co2.toFixed(0),
    ethylene: +simState.ethylene.toFixed(2),
    energy_w: +energy.toFixed(1),
    compressor_on: compressorOn,
    fan_on: fanOn,
    pid_output: +output.toFixed(2),
    target,
  };
}

// Tick: insert reading + advance spoilage on all food items + maybe alert
export const tickSimulation = createServerFn({ method: "POST" }).handler(async () => {
  const r = await generateReading();
  await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").insert({
    zone_id: "main",
    temperature: r.temperature, humidity: r.humidity,
    ammonia: r.ammonia, co2: r.co2, ethylene: r.ethylene,
    energy_w: r.energy_w, compressor_on: r.compressor_on, fan_on: r.fan_on,
  });

  // Advance spoilage for each food item (assume tick = 5 sec sim → scale to 30 min sim time per tick for visible movement)
  const dtHours = 0.5;
  const { data: foods } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*");
  if (foods) {
    for (const f of foods as any[]) {
      const delta = spoilageDelta({
        tempC: r.temperature, rh: r.humidity, ethylene: r.ethylene,
        category: f.category, baseShelfLifeHours: Number(f.base_shelf_life_hours),
        EaKJ: Number(f.activation_energy_kj), dtHours,
      });
      const next = Math.min(100, Number(f.spoilage_pct) + delta);
      await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").update({
        spoilage_pct: +next.toFixed(3), last_updated: new Date().toISOString(),
      }).eq("id", f.id);

      if (next > 80 && Number(f.spoilage_pct) <= 80) {
        await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("alerts").insert({
          alert_type: "spoilage", severity: "CRITICAL",
          message: `${f.name} has crossed 80% spoilage — consume or remove.`,
        });
      }
    }
  }

  // Environmental alerts
  if (r.temperature > 8) {
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("alerts").insert({
      alert_type: "temperature", severity: "WARNING",
      message: `Temperature spike: ${r.temperature}°C exceeds safe range.`,
    });
  }
  if (r.humidity > 85) {
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("alerts").insert({
      alert_type: "humidity", severity: "WARNING",
      message: `High humidity ${r.humidity}% accelerating microbial growth.`,
    });
  }

  // Log control decision
  await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("control_logs").insert({
    prev_temp: r.temperature, target_temp: r.target,
    cooling_level: r.compressor_on ? 100 : 0, pid_output: r.pid_output,
    reason: r.compressor_on ? "PID demanded cooling" : "Within target band",
  });

  return r;
});

// ---- Read endpoints ----
export const getOverview = createServerFn({ method: "GET" }).handler(async () => {
  const [foods, latest, alerts, settings, energySeries, tempSeries] = await Promise.all([
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*").order("spoilage_pct", { ascending: false }),
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(20),
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("system_settings").select("*").eq("id", 1).maybeSingle(),
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").select("created_at,energy_w,compressor_on").order("created_at", { ascending: false }).limit(60),
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").select("created_at,temperature,humidity,ammonia,co2,ethylene").order("created_at", { ascending: false }).limit(60),
  ]);

  const items = foods.data ?? [];
  const enriched = items.map((f: any) => {
    const ratePerH = latest.data
      ? spoilageDelta({
          tempC: Number(latest.data.temperature),
          rh: Number(latest.data.humidity),
          ethylene: Number(latest.data.ethylene),
          category: f.category,
          baseShelfLifeHours: Number(f.base_shelf_life_hours),
          EaKJ: Number(f.activation_energy_kj),
          dtHours: 1,
        })
      : 0;
    const remH = remainingHours(Number(f.spoilage_pct), ratePerH);
    const risk =
      Number(f.spoilage_pct) > 75 ? "critical"
      : Number(f.spoilage_pct) > 45 ? "warning"
      : "safe";
    return { ...f, current_rate: +ratePerH.toFixed(3), remaining_hours: isFinite(remH) ? +remH.toFixed(1) : null, risk };
  });

  const avgSpoilage = items.length
    ? items.reduce((s: number, f: any) => s + Number(f.spoilage_pct), 0) / items.length
    : 0;

  return {
    latest: latest.data,
    settings: settings.data,
    foods: enriched,
    alerts: alerts.data ?? [],
    avgSpoilage: +avgSpoilage.toFixed(1),
    energySeries: (energySeries.data ?? []).reverse(),
    tempSeries: (tempSeries.data ?? []).reverse(),
  };
});

// ---- Food CRUD ----
export const addFoodItem = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; category: string; zone: string; baseShelfHours: number; EaKJ: number }) => d)
  .handler(async ({ data }) => {
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").insert({
      name: data.name, category: data.category, zone_id: data.zone,
      base_shelf_life_hours: data.baseShelfHours, activation_energy_kj: data.EaKJ,
    });
    return { ok: true };
  });

export const removeFoodItem = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").delete().eq("id", data.id);
    return { ok: true };
  });

// ---- Settings ----
export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator((d: Partial<{
    target_temp: number; kp: number; ki: number; kd: number;
    manual_override: boolean; fan_manual: boolean; compressor_manual: boolean;
  }>) => d)
  .handler(async ({ data }) => {
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("system_settings").update(data).eq("id", 1);
    return { ok: true };
  });

// ---- Alerts ----
export const resolveAlert = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("alerts").update({ resolved: true }).eq("id", data.id);
    return { ok: true };
  });

// ---- AI Recommendation (Lovable AI Gateway) ----
export const generateRecommendation = createServerFn({ method: "POST" }).handler(async () => {
  const { data: latest } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings")
    .select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: foods } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*");
  const { data: alerts } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("alerts").select("*").eq("resolved", false).limit(5);

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    const fallback = "AI gateway not configured. Showing rule-based insight: " +
      (latest && Number(latest.humidity) > 80
        ? "High humidity is the dominant spoilage driver right now — reduce by venting briefly."
        : "Conditions are within nominal range; continue monitoring.");
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("ai_recommendations").insert({
      recommendation: fallback, severity: "INFO", generated_from: "fallback",
    });
    return { recommendation: fallback };
  }

  const ctx = {
    latestReading: latest,
    foodItems: foods?.map((f: any) => ({ name: f.name, category: f.category, spoilage: f.spoilage_pct })),
    activeAlerts: alerts?.map((a: any) => `${a.severity}: ${a.message}`),
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a refrigeration domain expert. Given live sensor data and food state, produce ONE actionable recommendation in 1-2 sentences. Be specific. No preamble." },
        { role: "user", content: `Current state:\n${JSON.stringify(ctx, null, 2)}` },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    return { recommendation: `AI gateway error (${res.status}): ${txt.slice(0, 200)}` };
  }
  const json = await res.json() as any;
  const rec = json.choices?.[0]?.message?.content?.trim() ?? "No recommendation produced.";
  await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("ai_recommendations").insert({
    recommendation: rec, severity: "INFO", generated_from: "gemini-2.5-flash",
  });
  return { recommendation: rec };
});

export const getRecommendations = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("ai_recommendations")
    .select("*").order("created_at", { ascending: false }).limit(15);
  return { items: data ?? [] };
});

// ---- Predictions: 24h forward simulation per food item ----
export const getForecast = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: latest }, { data: foods }] = await Promise.all([
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*"),
  ]);
  if (!latest || !foods) return { points: [] };

  const points: Array<{ hour: number; [k: string]: number }> = [];
  for (let h = 0; h <= 24; h++) {
    const row: any = { hour: h };
    for (const f of foods as any[]) {
      const rate = spoilageDelta({
        tempC: Number(latest.temperature), rh: Number(latest.humidity),
        ethylene: Number(latest.ethylene), category: f.category,
        baseShelfLifeHours: Number(f.base_shelf_life_hours),
        EaKJ: Number(f.activation_energy_kj), dtHours: 1,
      });
      row[f.name] = Math.min(100, Number(f.spoilage_pct) + rate * h);
    }
    points.push(row);
  }
  return { points, foods: foods.map((f: any) => f.name) };
});

// Arrhenius curve data
export const getArrheniusCurve = createServerFn({ method: "GET" }).handler(async () => {
  const { data: foods } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("name,activation_energy_kj").limit(4);
  const temps: number[] = [];
  for (let t = -5; t <= 25; t += 1) temps.push(t);
  const points = temps.map((t) => {
    const row: any = { temp: t };
    for (const f of (foods ?? []) as any[]) {
      row[f.name] = +arrheniusRate(t, Number(f.activation_energy_kj)).toFixed(4);
    }
    return row;
  });
  return { points, foods: foods?.map((f: any) => f.name) ?? [] };
});
