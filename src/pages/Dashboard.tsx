import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CalendarRange, ClipboardList, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    title: "RCCP",
    description: "Rough-Cut Capacity Planning — weekly capacity overview and machine group configuration.",
    icon: BarChart3,
    href: "/rccp",
    stat: "2 overloaded weeks",
    statColor: "text-status-danger",
  },
  {
    title: "Scheduler",
    description: "Core planning module — Gantt chart, order management, and constraint validation.",
    icon: CalendarRange,
    href: "/scheduler",
    stat: "10 active orders",
    statColor: "text-primary",
  },
  {
    title: "Planbord",
    description: "Short-term 2-day operational board with material-aware planning.",
    icon: ClipboardList,
    href: "/planbord",
    stat: "3 material warnings",
    statColor: "text-status-warning",
  },
];

export default function Dashboard() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Production Planning Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Select a module to begin planning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {modules.map((m) => (
          <Link key={m.title} to={m.href}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <m.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{m.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{m.description}</p>
                <span className={`text-xs font-medium ${m.statColor}`}>{m.stat}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-status-warning/30 bg-status-warning/5">
        <CardContent className="py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-warning shrink-0" />
          <span className="text-sm text-foreground">
            <strong>Attention:</strong> Milling group at 102% utilization — review RCCP to adjust capacity.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
