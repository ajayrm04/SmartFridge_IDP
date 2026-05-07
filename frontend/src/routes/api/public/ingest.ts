import { createFileRoute } from "@tanstack/react-router";
import { tickSimulation } from "@/fridge.functions";

// Public ingest endpoint — ESP32 POSTs JSON OR cron triggers a simulation tick
export const Route = createFileRoute("/api/public/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any = {};
        try { body = await request.json(); } catch { /* empty body = simulate */ }

        if (body && typeof body.temperature === "number") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("sensor_readings").insert({
            zone_id: body.zone_id ?? "main",
            temperature: body.temperature,
            humidity: body.humidity ?? 70,
            ammonia: body.ammonia ?? 0,
            co2: body.co2 ?? 400,
            ethylene: body.ethylene ?? 0,
            energy_w: body.energy_w ?? 0,
            compressor_on: !!body.compressor_on,
            fan_on: !!body.fan_on,
          });
          return Response.json({ ok: true, mode: "device" });
        }

        const r = await tickSimulation();
        return Response.json({ ok: true, mode: "simulated", reading: r });
      },
      GET: async () => Response.json({ status: "ready", usage: "POST sensor JSON or empty body to simulate" }),
    },
  },
});
