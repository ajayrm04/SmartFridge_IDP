import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Bot } from "lucide-react";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getRecommendations, generateRecommendation, getOverview } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Center · FRIGOS" }] }),
  component: AIPage,
});

function AIPage() {
  const { data, refresh } = useLiveQuery(() => getRecommendations(), 8000);
  const { data: overview } = useLiveQuery(() => getOverview(), 5000);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await generateRecommendation();
      toast.success("New insight generated");
      refresh();
    } catch {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Intelligence · LLM"
        title="AI recommendation engine"
        description="Gemini-powered analysis of live conditions, food state, and active alerts — turned into actionable steps."
        action={
          <Button onClick={handleGenerate} disabled={generating} size="sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {generating ? "Thinking…" : "Generate insight"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="System summary" className="lg:col-span-1">
          <ul className="space-y-2 text-sm">
            <SummaryRow k="Internal temp" v={`${Number(overview?.latest?.temperature ?? 0).toFixed(1)} °C`} />
            <SummaryRow k="Humidity" v={`${Number(overview?.latest?.humidity ?? 0).toFixed(0)} %`} />
            <SummaryRow k="Avg spoilage" v={`${overview?.avgSpoilage ?? 0} %`} />
            <SummaryRow k="Active alerts" v={`${overview?.alerts?.length ?? 0}`} />
            <SummaryRow k="Items tracked" v={`${overview?.foods?.length ?? 0}`} />
          </ul>
          <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Bot className="mr-1 inline h-3.5 w-3.5 text-primary" />
            Insights are generated from real-time sensor + spoilage state. The LLM doesn't compute physics — it interprets it.
          </div>
        </Panel>

        <Panel title="Insight stream" className="lg:col-span-2">
          <ScrollArea className="h-[520px] pr-3">
            <div className="space-y-3">
              {(data?.items ?? []).length === 0 && (
                <div className="rounded-md border border-border/50 bg-surface p-6 text-center text-sm text-muted-foreground">
                  No insights yet. Click <span className="text-primary">Generate insight</span> to ask the AI to analyze the current state.
                </div>
              )}
              {(data?.items ?? []).map((i: any) => (
                <motion.div
                  key={i.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-md border border-border/50 bg-gradient-to-br from-surface to-surface-elev p-4"
                >
                  <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="h-3 w-3" />
                    {i.generated_from ?? "ai"} · {new Date(i.created_at).toLocaleTimeString()}
                  </div>
                  <p className="text-sm leading-relaxed">{i.recommendation}</p>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Panel>
      </div>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </li>
  );
}
