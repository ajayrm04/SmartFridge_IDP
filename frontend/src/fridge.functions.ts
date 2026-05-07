import { createServerFn } from "@tanstack/react-start";
import { spoilageDelta, remainingHours, arrheniusRate, humidityFactor, pidStep, calculateRealTimeSpoilage } from "@/lib/spoilage";

// The URL of your Node.js backend
const BACKEND_URL = "http://127.0.0.1:3000";

// Keep this to track PID state between ticks
let simState = {
  pid: { integral: 0, lastError: 0 },
};

async function generateReading() {
  // 1. Fetch REAL sensor data from your Node.js backend
  const response = await fetch(`${BACKEND_URL}/data`);
  const realData = await response.json();

  // 2. Fetch system settings for PID and target temperature
  const { data: settings } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin
    .from("system_settings").select("*").eq("id", 1).single();
  
  const target = settings?.target_temp ?? 4;

  // 3. Run PID calculation based on the REAL temperature from the ESP
  const { output, state } = pidStep(
    realData.temperature, 
    target, 
    simState.pid,
    { kp: settings?.kp ?? 2, ki: settings?.ki ?? 0.1, kd: settings?.kd ?? 0.5 },
    0.5
  );
  simState.pid = state;

  // 4. Determine if Compressor/Fan should be ON
  const compressorOn = settings?.manual_override ? !!settings.compressor_manual : output > 25;
  const fanOn = settings?.manual_override ? !!settings.fan_manual : output > 10;

  // 5. SYNC THE PHYSICAL RELAY
  // We send the command back to the Node.js backend so the ESP32 can fetch it
  try {
    if (compressorOn) {
      await fetch(`${BACKEND_URL}/relay/on`);
    } else {
      await fetch(`${BACKEND_URL}/relay/off`);
    }
  } catch (err) {
    console.error("Failed to sync relay command to backend:", err);
  }

  // 6. Return the combined object for Supabase insertion
  return {
    temperature:Number(realData.temperature),
    humidity: Number(realData.humidity),
    ammonia: Number(realData.gas_level), // Mapping your MQ3 gas_level here
    energy_w: (compressorOn ? 110 : 8) + (fanOn ? 12 : 0), 
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
    ammonia: r.ammonia,
    energy_w: r.energy_w, compressor_on: r.compressor_on, fan_on: r.fan_on,
  });

  // Advance spoilage for each food item based on real time elapsed since storage
  const currentTime = new Date();
  const { data: foods } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*");
  if (foods) {
    for (const f of foods as any[]) {
      const realTimeSpoilage = calculateRealTimeSpoilage({
        storedAt: f.stored_at || f.last_updated || new Date().toISOString(),
        currentTime,
        tempC: r.temperature,
        rh: r.humidity,
        ammonia: r.ammonia,
        category: f.category,
        baseShelfLifeHours: Number(f.base_shelf_life_hours),
        EaKJ: Number(f.activation_energy_kj),
      });

      await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").update({
        spoilage_pct: +realTimeSpoilage.toFixed(3), last_updated: currentTime.toISOString(),
      }).eq("id", f.id);

      if (realTimeSpoilage > 80 && Number(f.spoilage_pct) <= 80) {
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
    (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").select("created_at,temperature,humidity,ammonia").order("created_at", { ascending: false }).limit(60),
  ]);

  const items = foods.data ?? [];
  const currentTime = new Date();
  const enriched = items.map((f: any) => {
    // Calculate real-time spoilage for accurate display
    const realTimeSpoilage = latest.data ? calculateRealTimeSpoilage({
      storedAt: f.stored_at || f.last_updated || currentTime.toISOString(),
      currentTime,
      tempC: Number(latest.data.temperature),
      rh: Number(latest.data.humidity),
      ammonia: Number(latest.data.ammonia),
      category: f.category,
      baseShelfLifeHours: Number(f.base_shelf_life_hours),
      EaKJ: Number(f.activation_energy_kj),
    }) : Number(f.spoilage_pct);

    const ratePerH = latest.data
      ? spoilageDelta({
          tempC: Number(latest.data.temperature),
          rh: Number(latest.data.humidity),
          ammonia: Number(latest.data.ammonia),
          category: f.category,
          baseShelfLifeHours: Number(f.base_shelf_life_hours),
          EaKJ: Number(f.activation_energy_kj),
          dtHours: 1,
        })
      : 0;
    const remH = remainingHours(realTimeSpoilage, ratePerH);
    const risk =
      realTimeSpoilage > 75 ? "critical"
      : realTimeSpoilage > 45 ? "warning"
      : "safe";
    return { ...f, spoilage_pct: +realTimeSpoilage.toFixed(3), current_rate: +ratePerH.toFixed(3), remaining_hours: isFinite(remH) ? +remH.toFixed(1) : null, risk };
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
    const now = new Date().toISOString();
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").insert({
      name: data.name, category: data.category, zone_id: data.zone,
      base_shelf_life_hours: data.baseShelfHours, activation_energy_kj: data.EaKJ,
      stored_at: now, last_updated: now, spoilage_pct: 0,
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

// ---- AI Recommendation (Gemini API) ----
export const generateRecommendation = createServerFn({ method: "POST" }).handler(async () => {
  const { data: foods } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*");
  const { data: latest } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings")
    .select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();

  const apiKey = "YOUR KEY";
  
  const currentTime = new Date();
  
  // Build inventory context: items, locations, remaining time
  const inventory = foods?.map((f: any) => {
    const realTimeSpoilage = latest ? calculateRealTimeSpoilage({
      storedAt: f.stored_at || f.last_updated || currentTime.toISOString(),
      currentTime,
      tempC: Number(latest.temperature),
      rh: Number(latest.humidity),
      ammonia: Number(latest.ammonia),
      category: f.category,
      baseShelfLifeHours: Number(f.base_shelf_life_hours),
      EaKJ: Number(f.activation_energy_kj),
    }) : Number(f.spoilage_pct);
    
    const ratePerH = latest ? spoilageDelta({
      tempC: Number(latest.temperature),
      rh: Number(latest.humidity),
      ammonia: Number(latest.ammonia),
      category: f.category,
      baseShelfLifeHours: Number(f.base_shelf_life_hours),
      EaKJ: Number(f.activation_energy_kj),
      dtHours: 1,
    }) : 0;
    
    const remH = remainingHours(realTimeSpoilage, ratePerH);
    
    return {
      name: f.name,
      category: f.category,
      zone: f.zone_id,
      spoilage_pct: +realTimeSpoilage.toFixed(1),
      remaining_hours: isFinite(remH) ? +remH.toFixed(1) : null,
    };
  }) ?? [];

  const ctx = {
    fridge_inventory: inventory,
    current_conditions: {
      temperature: latest?.temperature ?? null,
      humidity: latest?.humidity ?? null,
      ammonia: latest?.ammonia ?? null,
    },
  };

  if (!apiKey) {
    const fallback = "No items at critical risk. Continue monitoring.";
    await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("ai_recommendations").insert({
      recommendation: fallback, severity: "INFO", generated_from: "fallback",
    });
    return { recommendation: fallback, inventory: ctx };
  }

  // Direct Google Gemini API endpoint
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  console.log(JSON.stringify(ctx, null, 2))
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a refrigeration expert. Based on the fridge inventory below, produce ONE actionable recommendation in 1-2 sentences. Focus on items expiring soon. Be specific. No preamble.\n\n${JSON.stringify(ctx, null, 2)}`
        }]
      }]
    }),
  });

  if (!res.ok) {
    const errorData = await res.json() as any;
    const errorMsg = errorData.error?.message || "Unknown error";
    return { recommendation: `Error: ${errorMsg.slice(0, 100)}`, inventory: ctx };
  }

  const json = await res.json() as any;
  console.log(json)
  const rec = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "No recommendation produced.";

  await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("ai_recommendations").insert({
    recommendation: rec, 
    severity: "INFO", 
    generated_from: "gemini-2.5-flash",
  });

  console.log({recommendation: rec, inventory: ctx})
  return { recommendation: rec, inventory: ctx };
});

export const getRecommendations = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("ai_recommendations")
    .select("*").order("created_at", { ascending: false }).limit(15);
  return { items: data ?? [] };
});

// ---- Predictions: 24h forward simulation per food item ----
export const getForecast = createServerFn({ method: "GET" })
  .inputValidator((d: { maxHours?: number }) => d)
  .handler(async ({ data }) => {
    const maxHours = data?.maxHours ?? 12;
    const [{ data: latest }, { data: foods }] = await Promise.all([
      (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("sensor_readings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      (await import("@/integrations/supabase/client.server")).supabaseAdmin.from("food_items").select("*"),
    ]);
    if (!latest || !foods) return { points: [] };

    const currentTime = new Date();
    const points: Array<{ hour: number; [k: string]: number }> = [];
    for (let h = 0; h <= maxHours; h++) {
      const row: any = { hour: h };
      for (const f of foods as any[]) {
        // Calculate current real-time spoilage
        const currentSpoilage = calculateRealTimeSpoilage({
          storedAt: f.stored_at || f.last_updated || currentTime.toISOString(),
          currentTime,
          tempC: Number(latest.temperature),
          rh: Number(latest.humidity),
          ammonia: Number(latest.ammonia),
          category: f.category,
          baseShelfLifeHours: Number(f.base_shelf_life_hours),
          EaKJ: Number(f.activation_energy_kj),
        });

        const rate = spoilageDelta({
          tempC: Number(latest.temperature), rh: Number(latest.humidity),
          ammonia: Number(latest.ammonia),
          category: f.category,
          baseShelfLifeHours: Number(f.base_shelf_life_hours),
          EaKJ: Number(f.activation_energy_kj), dtHours: 1,
        });
        row[f.name] = Math.min(100, currentSpoilage + rate * h);
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