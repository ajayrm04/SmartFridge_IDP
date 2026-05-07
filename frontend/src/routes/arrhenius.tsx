import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getArrheniusCurve } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/arrhenius")({
  head: () => ({ meta: [{ title: "Arrhenius Lab · FRIGOS" }] }),
  component: ArrheniusPage,
});

const COLORS = ["oklch(0.85 0.18 165)", "oklch(0.78 0.16 35)", "oklch(0.72 0.18 280)", "oklch(0.82 0.16 75)"];

function ArrheniusPage() {
  const { data } = useLiveQuery(() => getArrheniusCurve(), 8000);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Intelligence · Science"
        title="Arrhenius spoilage kinetics"
        description="Spoilage rate constant k = A·exp(−Eₐ/RT) — relative to reference at 4 °C. Higher k means faster degradation."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Rate vs temperature" className="lg:col-span-2">
          <div className="h-96">
            <ResponsiveContainer>
              <LineChart data={data?.points ?? []}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.04)" />
                <XAxis dataKey="temp" unit="°C" stroke="oklch(0.7 0.02 250)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} label={{ value: "k (relative)", angle: -90, position: "insideLeft", fill: "oklch(0.7 0.02 250)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.03 262)", border: "1px solid oklch(0.28 0.025 262)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine x={4} stroke="oklch(0.85 0.18 165)" strokeDasharray="4 4" label={{ value: "Tref", fill: "oklch(0.85 0.18 165)", fontSize: 10 }} />
                {(data?.foods ?? []).map((n: string, i: number) => (
                  <Line key={n} type="monotone" dataKey={n} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Equation">
          <div className="rounded-md border border-border/50 bg-surface p-4 text-sm">
            <div className="font-mono text-lg text-primary">k(T) = A·e^(−Eₐ/RT)</div>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li><span className="text-foreground">k</span> · spoilage rate constant</li>
              <li><span className="text-foreground">Eₐ</span> · activation energy (kJ/mol)</li>
              <li><span className="text-foreground">R</span> · 8.314 J/(mol·K)</li>
              <li><span className="text-foreground">T</span> · absolute temperature (K)</li>
            </ul>
          </div>
          <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            FRIGOS multiplies k by humidity factor before integrating spoilage over time.
          </div>
        </Panel>
      </div>
    </div>
  );
}
