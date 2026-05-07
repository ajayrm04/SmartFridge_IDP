import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && (
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

export function StatCard({ label, value, unit, hint, accent = "primary", icon }: {
  label: string; value: string | number; unit?: string; hint?: string;
  accent?: "primary" | "accent" | "warning" | "destructive" | "success";
  icon?: ReactNode;
}) {
  const accentMap = {
    primary: "text-primary",
    accent: "text-[oklch(0.78_0.16_35)]",
    warning: "text-[oklch(0.82_0.16_75)]",
    destructive: "text-destructive",
    success: "text-[oklch(0.78_0.18_155)]",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="panel relative overflow-hidden p-5"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        {icon && <div className={`opacity-60 ${accentMap[accent]}`}>{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className={`font-display text-3xl font-semibold tracking-tight ${accentMap[accent]}`}>
          {value}
        </div>
        {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}

export function Panel({ title, action, children, className = "" }: {
  title?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`panel p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
