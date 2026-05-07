import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/twin")({
  head: () => ({ meta: [{ title: "Digital Twin · FRIGOS" }] }),
  component: TwinPage,
});

const ZONES = [
  { id: "top", label: "Top shelf", area: "1 / 1 / 2 / 3" },
  { id: "main", label: "Main", area: "2 / 1 / 3 / 3" },
  { id: "crisper", label: "Crisper", area: "3 / 1 / 4 / 2" },
  { id: "door", label: "Door", area: "3 / 2 / 4 / 3" },
];

function TwinPage() {
  const { data } = useLiveQuery(() => getOverview(), 3000);
  const foods = data?.foods ?? [];
  const byZone: Record<string, any[]> = {};
  for (const f of foods) (byZone[f.zone_id] ||= []).push(f);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Intelligence · Simulation"
        title="Refrigerator digital twin"
        description="Compartment view with per-zone spoilage intensity heat-mapping."
      />
      <Panel>
        <div
          className="mx-auto grid aspect-[3/4] max-w-md gap-2 rounded-2xl border-4 border-border/60 bg-gradient-to-b from-surface to-background p-3"
          style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1.4fr 1fr" }}
        >
          {ZONES.map((z) => {
            const items = byZone[z.id] ?? [];
            const avg = items.length ? items.reduce((s, f) => s + f.spoilage_pct, 0) / items.length : 0;
            const intensity = Math.min(1, avg / 100);
            return (
              <motion.div
                key={z.id}
                style={{ gridArea: z.area }}
                animate={{
                  background: `linear-gradient(135deg, color-mix(in oklch, oklch(0.65 0.24 18) ${intensity * 60}%, oklch(0.85 0.18 165 / 0.15)), oklch(0.235 0.03 262))`,
                }}
                className="relative flex flex-col rounded-lg border border-border/50 p-3"
              >
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{z.label}</div>
                <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{avg.toFixed(0)}%</div>
                <div className="mt-auto space-y-0.5">
                  {items.slice(0, 3).map((f) => (
                    <div key={f.id} className="truncate text-[10px] text-muted-foreground">• {f.name}</div>
                  ))}
                  {items.length === 0 && <div className="text-[10px] text-muted-foreground/60">empty</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Color intensity = avg spoilage % in zone.</p>
      </Panel>
    </div>
  );
}
