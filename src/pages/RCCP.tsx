import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { capacityData, machineGroups } from "@/data/mockData";

const totalAvailable = capacityData.reduce((s, w) => s + w.available, 0);
const totalRequired = capacityData.reduce((s, w) => s + w.required, 0);
const gap = (((totalRequired - totalAvailable) / totalAvailable) * 100).toFixed(1);
const criticalGroup = machineGroups.find((g) => g.status === "danger");

const summaryCards = [
  { title: "Total Available", value: `${totalAvailable}h`, icon: TrendingUp, color: "text-primary" },
  { title: "Total Required", value: `${totalRequired}h`, icon: TrendingDown, color: "text-status-warning" },
  { title: "Capacity Gap", value: `${gap}%`, icon: Activity, color: Number(gap) > 0 ? "text-status-danger" : "text-status-ok" },
  {
    title: "Critical Group",
    value: criticalGroup?.name ?? "None",
    icon: AlertTriangle,
    color: criticalGroup ? "text-status-danger" : "text-status-ok",
  },
];

export default function RCCP() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">RCCP — Capacity Planning</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.title}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <c.icon className={`h-5 w-5 ${c.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{c.title}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Capacity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={capacityData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 89%)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 14% 89%)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="available" name="Available" radius={[3, 3, 0, 0]}>
                  {capacityData.map((entry, i) => (
                    <Cell key={i} fill="hsl(214 80% 52%)" fillOpacity={0.7} />
                  ))}
                </Bar>
                <Bar dataKey="required" name="Required" radius={[3, 3, 0, 0]}>
                  {capacityData.map((entry, i) => (
                    <Cell key={i} fill={entry.required > entry.available ? "hsl(0 72% 51%)" : "hsl(38 92% 50%)"} />
                  ))}
                </Bar>
                <ReferenceLine y={480} stroke="hsl(214 80% 52%)" strokeDasharray="6 3" label={{ value: "Max", fontSize: 10, fill: "hsl(214 80% 52%)" }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right config panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Machine Group Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Machine Group</Label>
                <Select defaultValue="milling">
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {machineGroups.map((g) => (
                      <SelectItem key={g.name} value={g.name.toLowerCase()}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Shifts</Label>
                  <Input defaultValue="2" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Staffing %</Label>
                  <Input defaultValue="95" className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input type="date" defaultValue="2026-02-16" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input type="date" defaultValue="2026-04-12" className="h-8 text-xs mt-1" />
                </div>
              </div>
              <Button size="sm" className="w-full h-8 text-xs">Save Configuration</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Utilization by Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {machineGroups.map((g) => (
                <div key={g.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{g.name}</span>
                    <span
                      className={
                        g.status === "danger"
                          ? "text-status-danger font-bold"
                          : g.status === "warning"
                          ? "text-status-warning font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {g.utilization}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(g.utilization, 100)}
                    className={`h-1.5 ${
                      g.status === "danger"
                        ? "[&>div]:bg-status-danger"
                        : g.status === "warning"
                        ? "[&>div]:bg-status-warning"
                        : "[&>div]:bg-primary"
                    }`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
