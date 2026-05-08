import { createFileRoute } from "@tanstack/react-router";
import { Activity, Droplets, Wind, Zap, FlaskConical, Snowflake } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview, getLatestSensorReading } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/sensors")({
  head: () => ({ meta: [{ title: "Live Sensors · FRIGOS" }] }),
  component: SensorsPage,
});

function SensorsPage() {
  const { data: overviewData } = useLiveQuery(() => getOverview(), 4000);
  const { data: latest } = useLiveQuery(() => getLatestSensorReading(), 1500);
  const series = overviewData?.tempSeries ?? [];

  const cards = [
    { key: "temperature", label: "Temperature", unit: "°C", icon: Snowflake, safe: (v: number) => v < 6, danger: (v: number) => v > 8 },
    { key: "humidity", label: "Humidity", unit: "%", icon: Droplets, safe: (v: number) => v < 80, danger: (v: number) => v > 88 },
    { key: "ammonia", label: "Gas Concetration", unit: "ppm", icon: FlaskConical, safe: (v: number) => v < 1, danger: (v: number) => v > 2 },
    { key: "energy_w", label: "Energy draw", unit: "W", icon: Zap, safe: () => true, danger: () => false },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Operations · Telemetry"
        title="Live sensor matrix"
        description="Per-channel readings refreshed continuously with mini-trend analysis."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => {
          const v = latest ? Number((latest as any)[c.key]) : 0;
          const status = !latest ? "muted" : c.danger(v) ? "destructive" : c.safe(v) ? "success" : "warning";
          const color = {
            destructive: "oklch(0.65 0.24 18)",
            warning: "oklch(0.82 0.16 75)",
            success: "oklch(0.78 0.18 155)",
            muted: "oklch(0.7 0.02 250)",
          }[status];
          const sparkData = series.map((s: any, i: number) => ({ i, v: Number(s[c.key]) }));
          return (
            <Panel key={c.key}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <c.icon className="h-3.5 w-3.5" />{c.label}
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                  style={{ background: `color-mix(in oklch, ${color} 15%, transparent)`, color }}>
                  {status === "success" ? "nominal" : status}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <div className="font-display text-4xl font-semibold tabular-nums" style={{ color }}>
                  {v.toFixed(c.key === "energy_w" ? 0 : 2)}
                </div>
                <span className="text-xs text-muted-foreground">{c.unit}</span>
              </div>
              <div className="mt-3 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          );
        })}
      </div>
      <div className="mt-6 rounded-lg border border-border/50 bg-surface/50 p-4 text-xs text-muted-foreground">
        <Activity className="mr-2 inline h-3.5 w-3.5 text-primary" />
        ESP32 devices can POST sensor JSON to <code className="rounded bg-surface-elev px-1.5 py-0.5 text-primary">/api/public/ingest</code> to override the simulator.
      </div>
    </div>
  );
}
