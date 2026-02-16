import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  PackageCheck,
  PackageX,
  RotateCcw,
} from "lucide-react";
import { schedulerOrders, machines, type SchedulerOrder } from "@/data/mockData";

const statusColors: Record<string, string> = {
  planned: "bg-primary",
  locked: "bg-status-ok",
  "near-deadline": "bg-status-warning",
  late: "bg-status-danger",
};

const statusLabels: Record<string, string> = {
  planned: "Planned",
  locked: "Locked",
  "near-deadline": "Near Deadline",
  late: "Late",
};

// Generate 28 day columns
const days = Array.from({ length: 28 }, (_, i) => {
  const d = new Date(2026, 1, 16 + i);
  return {
    label: `${d.getDate()}/${d.getMonth() + 1}`,
    dayIndex: i,
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
});

export default function Scheduler() {
  const [selectedOrder, setSelectedOrder] = useState<SchedulerOrder | null>(null);
  const [showLateOnly, setShowLateOnly] = useState(false);

  const filteredOrders = showLateOnly
    ? schedulerOrders.filter((o) => o.status === "late" || o.status === "near-deadline")
    : schedulerOrders;

  const machineGroups = [...new Set(machines.map((m) => m.group))];

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filter bar */}
        <Card className="mb-3 shrink-0">
          <CardContent className="py-2 px-3 flex items-center gap-2 flex-wrap">
            <Select defaultValue="all">
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Machine Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {machineGroups.map((g) => (
                  <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all-machines">
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-machines">All Machines</SelectItem>
                {machines.map((m) => (
                  <SelectItem key={m.name} value={m.name.toLowerCase().replace(/\s/g, "-")}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Order #" className="h-7 w-28 text-xs" />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5">
              <Switch id="late" checked={showLateOnly} onCheckedChange={setShowLateOnly} className="scale-75" />
              <Label htmlFor="late" className="text-xs cursor-pointer">Late only</Label>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Trash2 className="h-3 w-3" />Purge</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Lock className="h-3 w-3" />Lock</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Unlock className="h-3 w-3" />Unlock</Button>
          </CardContent>
        </Card>

        {/* Gantt chart */}
        <Card className="flex-1 overflow-auto">
          <div className="min-w-[1200px]">
            {/* Timeline header */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              <div className="w-36 shrink-0 border-r border-border p-2 text-xs font-medium text-muted-foreground">
                Machine
              </div>
              <div className="flex-1 flex">
                {days.map((d) => (
                  <div
                    key={d.dayIndex}
                    className={`flex-1 min-w-[36px] text-center text-[10px] py-1.5 border-r border-border ${
                      d.isWeekend ? "bg-muted/50" : ""
                    } ${d.dayIndex === 0 ? "font-bold text-primary" : "text-muted-foreground"}`}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Machine rows */}
            {machines.map((machine) => {
              const machineOrders = filteredOrders.filter((o) => o.machine === machine.name);
              return (
                <div key={machine.name} className="flex border-b border-border hover:bg-muted/20">
                  <div className="w-36 shrink-0 border-r border-border p-2 text-xs font-medium flex items-center">
                    {machine.name}
                  </div>
                  <div className="flex-1 relative h-10">
                    {/* Weekend shading */}
                    {days.map((d) =>
                      d.isWeekend ? (
                        <div
                          key={d.dayIndex}
                          className="absolute top-0 bottom-0 bg-muted/30"
                          style={{
                            left: `${(d.dayIndex / 28) * 100}%`,
                            width: `${(1 / 28) * 100}%`,
                          }}
                        />
                      ) : null
                    )}
                    {/* Current time line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-primary z-10"
                      style={{ left: `${(0.5 / 28) * 100}%` }}
                    />
                    {/* Order blocks */}
                    {machineOrders.map((order) => (
                      <Tooltip key={order.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className={`absolute top-1 h-8 rounded ${statusColors[order.status]} text-white text-[10px] px-1.5 flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity truncate`}
                            style={{
                              left: `${(order.startDay / 28) * 100}%`,
                              width: `${(order.duration / 28) * 100}%`,
                            }}
                          >
                            {order.status === "locked" && <Lock className="h-2.5 w-2.5 shrink-0" />}
                            <span className="truncate">{order.orderNumber}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <p className="font-medium">{order.orderNumber} — {order.operation}</p>
                          <p>{order.duration} days • Qty: {order.quantity}</p>
                          <p>Status: {statusLabels[order.status]}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Legend */}
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          {Object.entries(statusLabels).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${statusColors[k]}`} />
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Right detail panel */}
      {selectedOrder && (
        <Card className="w-72 shrink-0 overflow-auto">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Order Details</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedOrder(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operation</span>
                <span>{selectedOrder.operation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{selectedOrder.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Deadline</span>
                <span className="flex items-center gap-1">
                  {selectedOrder.status === "late" && <AlertTriangle className="h-3 w-3 text-status-danger" />}
                  {selectedOrder.deadline}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Workstation</span>
                <span>{selectedOrder.preferredWorkstation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Material</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] gap-1 ${
                    selectedOrder.bomStatus === "ok"
                      ? "border-status-ok/30 text-status-ok"
                      : "border-status-danger/30 text-status-danger"
                  }`}
                >
                  {selectedOrder.bomStatus === "ok" ? (
                    <><PackageCheck className="h-3 w-3" /> OK</>
                  ) : (
                    <><PackageX className="h-3 w-3" /> Risk</>
                  )}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5 justify-start">
                <Lock className="h-3 w-3" /> Lock Order
              </Button>
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><ChevronLeft className="h-3 w-3" />Back</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">Fwd<ChevronRight className="h-3 w-3" /></Button>
              </div>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs" disabled>
                Split Order
              </Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5 justify-start">
                <RotateCcw className="h-3 w-3" /> Recalculate From Here
              </Button>
            </div>

            <Separator />

            {/* Validation warnings */}
            <div className="space-y-1.5">
              {selectedOrder.status === "late" && (
                <div className="flex items-start gap-1.5 text-status-danger">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Deadline conflict — order is overdue</span>
                </div>
              )}
              {selectedOrder.bomStatus === "risk" && (
                <div className="flex items-start gap-1.5 text-status-warning">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Possible material shortage</span>
                </div>
              )}
              {selectedOrder.status !== "late" && selectedOrder.bomStatus === "ok" && (
                <p className="text-muted-foreground">No issues detected.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
