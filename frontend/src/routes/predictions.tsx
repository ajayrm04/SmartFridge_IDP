import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getForecast } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "Predictions · FRIGOS" }] }),
  component: PredictionsPage,
});

const COLORS = ["oklch(0.85 0.18 165)", "oklch(0.78 0.16 35)", "oklch(0.72 0.18 280)", "oklch(0.82 0.16 75)", "oklch(0.70 0.16 220)", "oklch(0.78 0.18 155)", "oklch(0.65 0.24 18)"];

function PredictionsPage() {
  const { data } = useLiveQuery(() => getForecast(), 5000);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Intelligence · Forecast"
        title="24-hour spoilage projection"
        description="Forward-integrated Arrhenius model — projects each item's spoilage curve under current conditions."
      />
      <Panel title="Projected spoilage curves">
        <div className="h-96">
          <ResponsiveContainer>
            <LineChart data={data?.points ?? []}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.04)" />
              <XAxis dataKey="hour" stroke="oklch(0.7 0.02 250)" fontSize={11} label={{ value: "hours from now", position: "insideBottom", offset: -2, fill: "oklch(0.7 0.02 250)", fontSize: 10 }} />
              <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 262)", border: "1px solid oklch(0.28 0.025 262)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {(data?.foods ?? []).map((name: string, i: number) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
