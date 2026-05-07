import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getForecast } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "Predictions · FRIGOS" }] }),
  component: PredictionsPage,
});

const COLORS = ["oklch(0.85 0.18 165)", "oklch(0.78 0.16 35)", "oklch(0.72 0.18 280)", "oklch(0.82 0.16 75)", "oklch(0.70 0.16 220)", "oklch(0.78 0.18 155)", "oklch(0.65 0.24 18)"];

function PredictionsPage() {
  const [maxHours, setMaxHours] = useState(12);
  const { data } = useLiveQuery(() => getForecast({ data: { maxHours } }), 5000);
  const [focusedItem, setFocusedItem] = useState<string>("all");

  useEffect(() => {
    if (!focusedItem && (data?.foods?.length ?? 0) > 0) {
      setFocusedItem(data!.foods[0]);
    }
  }, [data?.foods, focusedItem]);

  const selectedDetail = (data?.foodDetails ?? []).find((f: any) => f.name === focusedItem) ?? null;

  const chartData = useMemo(() => {
    if (!focusedItem) return [];
    if (focusedItem === "all") return data?.points ?? [];
    const points = data?.points ?? [];
    const currentSpoilage = selectedDetail?.currentSpoilage ?? 0;
    const scannedExpiryAt = selectedDetail?.scannedExpiryAt ? new Date(selectedDetail.scannedExpiryAt).getTime() : null;
    const nowMs = Date.now();
    const scannedHoursToExpiry = scannedExpiryAt != null ? (scannedExpiryAt - nowMs) / (60 * 60 * 1000) : null;

    return points.map((row: any) => {
      const predictedSpoilage = row[focusedItem];
      const nextRow: any = { hour: row.hour, predicted: predictedSpoilage };
      if (scannedHoursToExpiry != null) {
        if (scannedHoursToExpiry <= 0) {
          nextRow.scanned = 100;
        } else {
          const ratio = Math.max(0, Math.min(1, row.hour / scannedHoursToExpiry));
          nextRow.scanned = Math.min(100, currentSpoilage + (100 - currentSpoilage) * ratio);
        }
      }
      return nextRow;
    });
  }, [data?.points, focusedItem, selectedDetail?.currentSpoilage, selectedDetail?.scannedExpiryAt]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Intelligence · Forecast"
        title={maxHours + "-hour spoilage projection"}
        description="Forward-integrated Arrhenius model — projects each item's spoilage curve under current conditions."
      />
      <Panel title="Projected spoilage curves">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Select item:</span>
          <select
            className="rounded-md border border-border bg-surface text-foreground px-2 py-1 outline-none ring-0"
            value={focusedItem}
            onChange={(e) => setFocusedItem(e.target.value)}
          >
            <option value="all">All items</option>
            {(data?.foods ?? []).map((name: string) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {focusedItem !== "all" && selectedDetail?.scannedExpiryAt && (
            <span className="text-xs text-emerald-400">Scanned: {new Date(selectedDetail.scannedExpiryAt).toLocaleString()}</span>
          )}
          {focusedItem !== "all" && selectedDetail?.predictedExpiryAt && (
            <span className="text-xs text-blue-400">
              Predicted: {new Date(selectedDetail.predictedExpiryAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="mb-4 flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMaxHours(prev => Math.max(6, prev - 6))}
            disabled={maxHours <= 6}
          >
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom out
          </Button>
          <input
            type="range"
            value={maxHours}
            onChange={e => setMaxHours(Number(e.target.value))}
            min={6}
            max={48}
            step={6}
            className="flex-1 cursor-pointer"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMaxHours(prev => Math.min(48, prev + 6))}
            disabled={maxHours >= 48}
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom in
          </Button>
          <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap">{maxHours}h</span>
        </div>
        <div className="h-96">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.04)" />
              <XAxis dataKey="hour" stroke="oklch(0.7 0.02 250)" fontSize={11} label={{ value: "hours from now", position: "insideBottom", offset: -2, fill: "oklch(0.7 0.02 250)", fontSize: 10 }} />
              <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 262)", border: "1px solid oklch(0.28 0.025 262)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {focusedItem === "all"
                ? (data?.foods ?? []).map((name: string, i: number) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))
                : focusedItem && (
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name={`${focusedItem} · predicted`}
                      stroke="oklch(0.70 0.16 220)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
              {focusedItem !== "all" && selectedDetail?.scannedExpiryAt && focusedItem && (
                <Line
                  type="monotone"
                  dataKey="scanned"
                  name={`${focusedItem} · scanned`}
                  stroke="oklch(0.78 0.18 155)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
