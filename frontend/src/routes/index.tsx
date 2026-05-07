import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Snowflake, Droplets, Zap, AlertTriangle, Wind, Bell, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview } from "@/fridge.functions";
import { PageHeader, StatCard, Panel } from "@/components/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Overview · FRIGOS" },
    { name: "description", content: "Live overview of refrigeration intelligence: temperature, humidity, energy and active spoilage risk." },
  ]}),
  component: OverviewPage,
});

function OverviewPage() {
  const { data } = useLiveQuery(() => getOverview(), 3000);
  const latest = data?.latest;
  const foods = data?.foods ?? [];
  const alerts = data?.alerts ?? [];
  const tempSeries = (data?.tempSeries ?? []).map((p: any, i: number) => ({
    i, t: Number(p.temperature), h: Number(p.humidity),
  }));
  const criticalCount = foods.filter((f: any) => f.risk === "critical").length;
  const warnCount = foods.filter((f: any) => f.risk === "warning").length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Operations · Realtime"
        title="Smart Fridge Management System"
        description="Continuous Arrhenius-based spoilage modelling across every item, with PID-tuned cooling and AI insight."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
              {foods.length} items tracked
            </Badge>
            <Button asChild size="sm" variant="secondary"><Link to="/ai">Open AI Center</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Internal temp"
          value={latest ? Number(latest.temperature).toFixed(1) : "—"} unit="°C"
          accent={latest && Number(latest.temperature) > 6 ? "warning" : "primary"}
          icon={<Snowflake className="h-4 w-4" />}
          hint={latest ? `target ${data?.settings?.target_temp ?? 4}°C` : undefined}
        />
        <StatCard
          label="Humidity"
          value={latest ? Number(latest.humidity).toFixed(0) : "—"} unit="%"
          accent={latest && Number(latest.humidity) > 80 ? "warning" : "primary"}
          icon={<Droplets className="h-4 w-4" />}
        />
        <StatCard
          label="Energy draw"
          value={latest ? Number(latest.energy_w).toFixed(0) : "—"} unit="W"
          accent="accent" icon={<Zap className="h-4 w-4" />}
          hint={latest?.compressor_on ? "compressor active" : "idle"}
        />
        <StatCard
          label="Avg spoilage"
          value={data?.avgSpoilage ?? 0} unit="%"
          accent={(data?.avgSpoilage ?? 0) > 50 ? "destructive" : "success"}
          icon={<Activity className="h-4 w-4" />}
          hint={`${criticalCount} critical · ${warnCount} warning`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Temperature & humidity · last 60 ticks" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tempSeries}>
                <defs>
                  <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.85 0.18 165)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.85 0.18 165)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 280)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 280)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.04)" />
                <XAxis dataKey="i" hide />
                <YAxis yAxisId="t" stroke="oklch(0.7 0.02 250)" fontSize={10} width={28} />
                <YAxis yAxisId="h" orientation="right" stroke="oklch(0.7 0.02 250)" fontSize={10} width={28} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.03 262)", border: "1px solid oklch(0.28 0.025 262)", borderRadius: 8, fontSize: 12 }} />
                <Area yAxisId="t" type="monotone" dataKey="t" stroke="oklch(0.85 0.18 165)" fill="url(#gT)" strokeWidth={2} name="Temp °C" />
                <Area yAxisId="h" type="monotone" dataKey="h" stroke="oklch(0.72 0.18 280)" fill="url(#gH)" strokeWidth={2} name="RH %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Active alerts" action={<Link to="/alerts" className="text-xs text-primary hover:underline">View all</Link>}>
          {alerts.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Bell className="h-4 w-4" />All systems nominal.</div>
          )}
          <ul className="space-y-2">
            {alerts.slice(0, 5).map((a: any) => (
              <li key={a.id} className="flex items-start gap-2 rounded-md border border-border/50 bg-surface p-2.5 text-xs">
                <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 ${a.severity === "CRITICAL" ? "text-destructive" : "text-[oklch(0.82_0.16_75)]"}`} />
                <div className="flex-1">
                  <div className="font-medium">{a.message}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.severity}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Top spoilage risk" className="lg:col-span-2">
          <ul className="space-y-2.5">
            {foods.slice(0, 5).map((f: any) => (
              <motion.li key={f.id} layout className="flex items-center gap-3">
                <div className="w-32 truncate text-sm font-medium">{f.name}</div>
                <div className="flex-1">
                  <div className="relative h-2 overflow-hidden rounded-full bg-surface-elev">
                    <motion.div
                      initial={false}
                      animate={{ width: `${Math.min(100, f.spoilage_pct)}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${
                        f.risk === "critical" ? "bg-destructive" :
                        f.risk === "warning" ? "bg-[oklch(0.82_0.16_75)]" :
                        "bg-gradient-to-r from-primary to-chart-5"
                      }`}
                    />
                  </div>
                </div>
                <div className="w-12 text-right text-xs tabular-nums text-muted-foreground">{f.spoilage_pct.toFixed(0)}%</div>
                <div className="w-20 text-right text-[11px] tabular-nums text-muted-foreground">
                  {f.remaining_hours == null ? "—" : `${f.remaining_hours.toFixed(0)} h left`}
                </div>
              </motion.li>
            ))}
          </ul>
        </Panel>

        <Panel title="System">
          <div className="space-y-3 text-sm">
            <Row label="Compressor" value={latest?.compressor_on ? "ON" : "Idle"} accent={latest?.compressor_on ? "primary" : "muted"} icon={<Snowflake className="h-3.5 w-3.5" />} />
            <Row label="Fan" value={latest?.fan_on ? "ON" : "Idle"} accent={latest?.fan_on ? "primary" : "muted"} icon={<Wind className="h-3.5 w-3.5" />} />
            <Row label="Ammonia (NH₃)" value={`${Number(latest?.ammonia ?? 0).toFixed(2)} ppm`} accent="muted" />
            <Row label="CO₂" value={`${Number(latest?.co2 ?? 0).toFixed(0)} ppm`} accent="muted" />
            <Row label="Ethylene" value={`${Number(latest?.ethylene ?? 0).toFixed(2)} ppm`} accent="muted" />
          </div>
          <Button asChild className="mt-4 w-full" size="sm" variant="secondary">
            <Link to="/control"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Tune controller</Link>
          </Button>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent: "primary" | "muted" }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className={`text-sm font-medium tabular-nums ${accent === "primary" ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
