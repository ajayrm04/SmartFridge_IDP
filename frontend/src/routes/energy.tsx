import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview } from "@/fridge.functions";
import { PageHeader, Panel, StatCard } from "@/components/ui-bits";
import { Zap, Snowflake } from "lucide-react";

export const Route = createFileRoute("/energy")({
  head: () => ({ meta: [{ title: "Energy · FRIGOS" }] }),
  component: EnergyPage,
});

function EnergyPage() {
  const { data } = useLiveQuery(() => getOverview(), 4000);
  const series = (data?.energySeries ?? []).map((p: any, i: number) => ({
    i, w: Number(p.energy_w), comp: p.compressor_on ? Number(p.energy_w) : 0,
  }));
  const total = series.reduce((s: number, p: any) => s + p.w, 0);
  const avg = series.length ? total / series.length : 0;
  const dutyCycle = series.length ? series.filter((p: any) => p.comp > 0).length / series.length : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Systems · Energy"
        title="Energy & cooling efficiency"
        description="Compressor duty cycle and live power draw across the last 60 ticks."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Avg power" value={avg.toFixed(0)} unit="W" accent="accent" icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Duty cycle" value={(dutyCycle * 100).toFixed(0)} unit="%" accent="primary" icon={<Snowflake className="h-4 w-4" />} />
        <StatCard label="Peak" value={Math.max(0, ...series.map((p: any) => p.w)).toFixed(0)} unit="W" accent="warning" />
        <StatCard label="Samples" value={series.length} unit="" accent="success" />
      </div>

      <Panel title="Power draw timeline" className="mt-4">
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.16 35)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.78 0.16 35)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.04)" />
              <XAxis dataKey="i" hide />
              <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} unit="W" />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 262)", border: "1px solid oklch(0.28 0.025 262)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="w" stroke="oklch(0.78 0.16 35)" fill="url(#ge)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
