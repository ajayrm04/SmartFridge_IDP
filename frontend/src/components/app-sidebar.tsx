import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Activity, Timer, FlaskConical, TrendingUp,
  Box, Zap, Bell, Sparkles, SlidersHorizontal, Snowflake,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Operations",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard },
      { title: "Live Sensors", url: "/sensors", icon: Activity },
      { title: "Shelf Life", url: "/shelf-life", icon: Timer },
      { title: "Control Panel", url: "/control", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "AI Center", url: "/ai", icon: Sparkles },
      { title: "Predictions", url: "/predictions", icon: TrendingUp },
      { title: "Arrhenius Lab", url: "/arrhenius", icon: FlaskConical },
      { title: "Digital Twin", url: "/twin", icon: Box },
    ],
  },
  {
    label: "Systems",
    items: [
      { title: "Energy", url: "/energy", icon: Zap },
      { title: "Alerts", url: "/alerts", icon: Bell },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-5 glow-primary">
            <Snowflake className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">FRIGOS</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                predictive fridge OS
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = path === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={item.url} className="group flex items-center gap-3">
                          <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
