import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CalendarRange, ClipboardList, AlertTriangle, PackageCheck, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { schedulerOrders, machines, machineGroups } from "@/data/mockData";

const modules = [
  {
    title: "RCCP",
    description: "Rough-Cut Capacity Planning — wekelijks capaciteitsoverzicht en machineconfiguratie.",
    icon: BarChart3,
    href: "/rccp",
    stat: "2 overbelaste weken",
    statColor: "text-status-danger",
  },
  {
    title: "Scheduler",
    description: "Kern planningsmodule — Gantt grafiek, orderbeheer en constraintvalidatie.",
    icon: CalendarRange,
    href: "/scheduler",
    stat: `${schedulerOrders.length} actieve orders`,
    statColor: "text-primary",
  },
  {
    title: "Planbord",
    description: "Korte termijn detailplanning met voorraadcontrole en ERP integratie.",
    icon: ClipboardList,
    href: "/planbord",
    stat: "Voorraad gevalideerd",
    statColor: "text-status-ok",
  },
];

// Calculate statistics
const stats = {
  totalOrders: schedulerOrders.length,
  lockedOrders: schedulerOrders.filter(o => o.status === 'locked').length,
  plannedOrders: schedulerOrders.filter(o => o.status === 'planned').length,
  lateOrders: schedulerOrders.filter(o => o.status === 'late').length,
  nearDeadlineOrders: schedulerOrders.filter(o => o.status === 'near-deadline').length,
  totalMachines: machines.length,
  machineGroups: machineGroups.length,
  avgOrderDuration: (schedulerOrders.reduce((sum, o) => sum + o.durationHours, 0) / schedulerOrders.length).toFixed(1),
  totalProductionHours: schedulerOrders.reduce((sum, o) => sum + o.durationHours, 0),
};

export default function Dashboard() {
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Productie Planning Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Selecteer een module om te beginnen met plannen.</p>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Totaal Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-status-ok">{stats.lockedOrders} vergrendeld</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary">{stats.plannedOrders} gepland</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Machines</p>
                <p className="text-2xl font-bold">{stats.totalMachines}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.machineGroups} machine groepen
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Productie Uren</p>
                <p className="text-2xl font-bold">{stats.totalProductionHours}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Ø {stats.avgOrderDuration}u per order
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Kritieke Orders</p>
                <p className="text-2xl font-bold text-status-danger">{stats.lateOrders + stats.nearDeadlineOrders}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-status-danger/30" />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-status-danger">{stats.lateOrders} te laat</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-status-warning">{stats.nearDeadlineOrders} bijna</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
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

      {/* Alert Banner */}
      {(stats.lateOrders > 0 || stats.nearDeadlineOrders > 0) && (
        <Card className="border-status-warning/30 bg-status-warning/5 mb-4">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-warning shrink-0" />
            <span className="text-sm text-foreground">
              <strong>Let op:</strong> {stats.lateOrders + stats.nearDeadlineOrders} orders zijn kritiek — 
              controleer de Scheduler om prioriteit aan te passen.
            </span>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-status-ok shrink-0" />
            <span className="text-sm text-foreground">
              ERP Systeem Verbonden — Laatste synchronisatie: {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Capaciteitsbenutting: 87%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
