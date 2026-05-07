import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Bell } from "lucide-react";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview, resolveAlert } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts · FRIGOS" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data, refresh } = useLiveQuery(() => getOverview(), 3000);
  const alerts = data?.alerts ?? [];

  const handle = async (id: number) => {
    await resolveAlert({ data: { id } });
    refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Systems · Alerts"
        title="Active alarms"
        description="Threshold-based and spoilage-acceleration alerts. Acknowledge to clear."
      />
      <Panel>
        {alerts.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">No active alerts. All systems nominal.</div>
          </div>
        )}
        <ul className="space-y-2">
          <AnimatePresence>
            {alerts.map((a: any) => (
              <motion.li key={a.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-md border border-border/50 bg-surface p-3"
              >
                <AlertTriangle className={`h-4 w-4 ${a.severity === "CRITICAL" ? "text-destructive" : "text-[oklch(0.82_0.16_75)]"}`} />
                <div className="flex-1">
                  <div className="text-sm">{a.message}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>{a.alert_type}</span><span>·</span><span>{a.severity}</span><span>·</span>
                    <span>{new Date(a.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handle(a.id)}>
                  <Check className="mr-1 h-3.5 w-3.5" />Resolve
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Panel>
    </div>
  );
}
