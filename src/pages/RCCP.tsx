import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  machineGroups,
  machines,
  capacityOverrides,
  staffingOverrides,
  type Machine,
  type CapacityOverride,
  type StaffingOverride,
} from '@/data/mockData';

type ViewMode = 'week' | 'month' | 'quarter';

// Helper function to check if a date falls within a period
const isDateInRange = (date: Date, start: string, end: string): boolean => {
  const dateTime = date.getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return dateTime >= startTime && dateTime <= endTime;
};

// Get effective capacity for a machine on a specific date
const getEffectiveCapacity = (
  machine: Machine,
  date: Date,
  overrides: CapacityOverride[]
): { capacityModifier: number; shiftCount: number } => {
  // Find if there's an override for this machine on this date
  const override = overrides.find((o) => o.machineId === machine.id && isDateInRange(date, o.startDate, o.endDate));

  if (override) {
    return {
      capacityModifier: override.capacityModifier,
      shiftCount: override.shiftCount,
    };
  }

  // Return default pattern
  return {
    capacityModifier: machine.capacityModifier,
    shiftCount: machine.shiftCount,
  };
};

// Get effective staffing for a group on a specific date
const getEffectiveStaffing = (
  groupId: string,
  date: Date,
  defaultStaffing: number,
  overrides: StaffingOverride[]
): number => {
  // Find if there's an override for this group on this date
  const override = overrides.find((o) => o.groupId === groupId && isDateInRange(date, o.startDate, o.endDate));

  if (override) {
    return override.staffingPercentage;
  }

  // Return default staffing
  return defaultStaffing;
};

// Generate capacity data based on machine configs and overrides
const generateCapacityData = (
  viewMode: ViewMode,
  dateFrom: string,
  dateTo: string,
  machineList: Machine[],
  groupStaffing: Map<string, number>,
  selectedGroupId: string,
  overrides: CapacityOverride[],
  staffingOverrideList: StaffingOverride[]
) => {
  const periods: { label: string; requiredCapacity: number;[key: string]: number | string }[] = [];

  const periodCount = viewMode === 'week' ? 8 : viewMode === 'month' ? 6 : 4;
  const periodPrefix = viewMode === 'week' ? 'Week' : viewMode === 'month' ? 'Maand' : 'Q';
  const baseWeek = 10;

  // Get machines for selected group
  const groupMachines = machineList.filter((m) => m.groupId === selectedGroupId);
  const defaultStaffing = groupStaffing.get(selectedGroupId) || 100;

  for (let i = 0; i < periodCount; i++) {
    const period: { label: string; requiredCapacity: number;[key: string]: number | string } = {
      label:
        viewMode === 'quarter' ? `${periodPrefix}${Math.floor(i / 3) + 1}` : `${periodPrefix} ${baseWeek + i}`,
      requiredCapacity: 0,
    };

    const hoursPerDay = 8;
    const daysInPeriod = viewMode === 'week' ? 5 : viewMode === 'month' ? 20 : 60;

    // For simplicity in mockup, use middle of period date
    const periodStartDate = new Date(dateFrom);
    periodStartDate.setDate(
      periodStartDate.getDate() + i * (viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 90)
    );

    // Get effective staffing for this period
    const staffingPercentage = getEffectiveStaffing(
      selectedGroupId,
      periodStartDate,
      defaultStaffing,
      staffingOverrideList
    );
    const staffing = staffingPercentage / 100;

    // Calculate capacity per machine
    let totalGroupCapacityWithoutStaffing = 0;
    let totalAvailableCapacity = 0;
    groupMachines.forEach((machine) => {
      const { capacityModifier, shiftCount } = getEffectiveCapacity(machine, periodStartDate, overrides);
      const efficiency = capacityModifier / 100;
      const baseCapacity = hoursPerDay * shiftCount * daysInPeriod * efficiency;
      const machineCapacity = baseCapacity * staffing;

      period[machine.id] = Math.round(machineCapacity);
      totalGroupCapacityWithoutStaffing += baseCapacity;
      totalAvailableCapacity += machineCapacity;
    });

    // Store total available capacity as a field for the line chart
    period.availableCapacity = Math.round(totalAvailableCapacity);

    // Mock required data as group total (NOT affected by staffing - this is the actual demand)
    const requiredRatio = 0.85 + Math.random() * 0.35;
    period.requiredCapacity = Math.round(totalGroupCapacityWithoutStaffing * requiredRatio);

    periods.push(period);
  }

  return periods;
};

export default function RCCP() {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [dateFrom, setDateFrom] = useState('2026-02-16');
  const [dateTo, setDateTo] = useState('2026-04-12');
  const [selectedGroup, setSelectedGroup] = useState<string>(machineGroups[0].id);
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    new Set(['availableCapacity', 'requiredCapacity'])
  );
  const [selectedMachine, setSelectedMachine] = useState<string>(machines[0].id);
  const [machineConfigs, setMachineConfigs] = useState<Map<string, Machine>>(new Map(machines.map((m) => [m.id, m])));
  const [groupStaffing, setGroupStaffing] = useState<Map<string, number>>(
    new Map(machineGroups.map((g) => [g.id, g.staffingPercentage]))
  );
  const [overrideList, setOverrideList] = useState<CapacityOverride[]>(capacityOverrides);
  const [staffingOverrideList, setStaffingOverrideList] = useState<StaffingOverride[]>(staffingOverrides);
  const [editingOverride, setEditingOverride] = useState<CapacityOverride | null>(null);
  const [editingStaffingOverride, setEditingStaffingOverride] = useState<StaffingOverride | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [staffingOverrideDialogOpen, setStaffingOverrideDialogOpen] = useState(false);

  const handleLegendClick = (data: any) => {
    const itemId = data.dataKey;
    if (itemId && (itemId === 'availableCapacity' || itemId === 'requiredCapacity')) {
      toggleItem(itemId);
    }
  };

  const toggleItem = (itemId: string) => {
    setVisibleGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const updateMachineConfig = (machineId: string, updates: Partial<Machine>) => {
    setMachineConfigs((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(machineId)!;
      newMap.set(machineId, { ...current, ...updates });
      return newMap;
    });
  };

  const updateGroupStaffing = (groupId: string, percentage: number) => {
    setGroupStaffing((prev) => {
      const newMap = new Map(prev);
      newMap.set(groupId, percentage);
      return newMap;
    });
  };

  const handleSaveOverride = () => {
    if (!editingOverride) return;

    if (editingOverride.id.startsWith('new-')) {
      // New override
      setOverrideList((prev) => [...prev, { ...editingOverride, id: `override-${Date.now()}` }]);
    } else {
      // Update existing
      setOverrideList((prev) => prev.map((o) => (o.id === editingOverride.id ? editingOverride : o)));
    }

    setOverrideDialogOpen(false);
    setEditingOverride(null);
  };

  const handleDeleteOverride = (id: string) => {
    setOverrideList((prev) => prev.filter((o) => o.id !== id));
  };

  const handleNewOverride = () => {
    setEditingOverride({
      id: `new-${Date.now()}`,
      machineId: machines[0].id,
      startDate: dateFrom,
      endDate: dateTo,
      capacityModifier: 80,
      shiftCount: 2,
      reason: '',
    });
    setOverrideDialogOpen(true);
  };

  const handleSaveStaffingOverride = () => {
    if (!editingStaffingOverride) return;

    if (editingStaffingOverride.id.startsWith('new-')) {
      // New override
      setStaffingOverrideList((prev) => [...prev, { ...editingStaffingOverride, id: `staffing-${Date.now()}` }]);
    } else {
      // Update existing
      setStaffingOverrideList((prev) =>
        prev.map((o) => (o.id === editingStaffingOverride.id ? editingStaffingOverride : o))
      );
    }

    setStaffingOverrideDialogOpen(false);
    setEditingStaffingOverride(null);
  };

  const handleDeleteStaffingOverride = (id: string) => {
    setStaffingOverrideList((prev) => prev.filter((o) => o.id !== id));
  };

  const handleNewStaffingOverride = () => {
    setEditingStaffingOverride({
      id: `new-${Date.now()}`,
      groupId: machineGroups[0].id,
      startDate: dateFrom,
      endDate: dateTo,
      staffingPercentage: 100,
      reason: '',
    });
    setStaffingOverrideDialogOpen(true);
  };

  // Generate chart data
  const chartData = useMemo(() => {
    return generateCapacityData(
      viewMode,
      dateFrom,
      dateTo,
      Array.from(machineConfigs.values()),
      groupStaffing,
      selectedGroup,
      overrideList,
      staffingOverrideList
    );
  }, [viewMode, dateFrom, dateTo, machineConfigs, groupStaffing, selectedGroup, overrideList, staffingOverrideList]);

  // Calculate totals
  const { totalAvailable, totalRequired } = useMemo(() => {
    const groupMachines = machines.filter((m) => m.groupId === selectedGroup);

    const available = chartData.reduce((sum, period) => {
      return (
        sum +
        groupMachines.reduce((machineSum, machine) => {
          return machineSum + ((period[machine.id] as number) || 0);
        }, 0)
      );
    }, 0);

    const required = chartData.reduce((sum, period) => {
      return sum + ((period.requiredCapacity as number) || 0);
    }, 0);

    return { totalAvailable: available, totalRequired: required };
  }, [chartData, selectedGroup]);

  const gap = totalAvailable > 0 ? (((totalRequired - totalAvailable) / totalAvailable) * 100).toFixed(1) : '0';
  const criticalGroup = machineGroups.find((g) => g.status === 'danger');

  const summaryCards = [
    {
      title: 'Totaal Beschikbaar',
      value: `${Math.round(totalAvailable)}h`,
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Totaal Vereist',
      value: `${Math.round(totalRequired)}h`,
      icon: TrendingDown,
      color: 'text-status-warning',
    },
    {
      title: 'Capaciteitskloof',
      value: `${gap}%`,
      icon: Activity,
      color: Number(gap) > 0 ? 'text-status-danger' : 'text-status-ok',
    },
    {
      title: 'Kritieke Groep',
      value: criticalGroup?.name ?? 'Geen',
      icon: AlertTriangle,
      color: criticalGroup ? 'text-status-danger' : 'text-status-ok',
    },
  ];

  const selectedMachineData = machineConfigs.get(selectedMachine)!;
  const selectedMachineGroup = machineGroups.find((g) => g.id === selectedMachineData.groupId)!;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">RCCP — Capaciteitsplanning</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="configuration">Capaciteitsconfiguratie</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 mt-4">
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

          {/* Filters */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Weergave</Label>
                  <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Per Week</SelectItem>
                      <SelectItem value="month">Per Maand</SelectItem>
                      <SelectItem value="quarter">Per Kwartaal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs">Van</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs">Tot</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs">Machine Groep</Label>
                  <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v)}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {machineGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-[1fr_320px] gap-4">
            {/* Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {viewMode === 'week'
                    ? 'Wekelijks'
                    : viewMode === 'month'
                      ? 'Maandelijks'
                      : 'Kwartaal'}{' '}
                  Capaciteitsoverzicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 89%)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(220 14% 89%)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, cursor: 'pointer' }}
                      onClick={handleLegendClick}
                    />
                    {visibleGroups.has('requiredCapacity') && (
                      <Bar
                        dataKey="requiredCapacity"
                        name="Vereiste Capaciteit"
                        fill="#ef4444"
                        fillOpacity={0.7}
                      />
                    )}
                    {visibleGroups.has('availableCapacity') && (
                      <Line
                        type="monotone"
                        dataKey="availableCapacity"
                        name="Beschikbare Capaciteit"
                        stroke={machineGroups.find((g) => g.id === selectedGroup)?.color || '#8884d8'}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Klik op de legenda om beschikbare/vereiste capaciteit in/uit te schakelen
                </div>
              </CardContent>
            </Card>

            {/* Right panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Machine Selectie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Machinegroep</Label>
                    <Select
                      value={selectedMachineGroup.id}
                      onValueChange={(groupId) => {
                        const firstMachine = machines.find((m) => m.groupId === groupId);
                        if (firstMachine) setSelectedMachine(firstMachine.id);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {machineGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Machine</Label>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(machineConfigs.values())
                          .filter((m) => m.groupId === selectedMachineGroup.id)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standaard Capaciteit:</span>
                      <span className="font-medium">{selectedMachineData.capacityModifier}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standaard Ploegen:</span>
                      <span className="font-medium">{selectedMachineData.shiftCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bezetting:</span>
                      <span className="font-medium">
                        {groupStaffing.get(selectedMachineGroup.id)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Gebruik per Groep</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {machineGroups.map((g) => (
                    <div key={g.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{g.name}</span>
                        <span
                          className={
                            g.status === 'danger'
                              ? 'text-status-danger font-bold'
                              : g.status === 'warning'
                                ? 'text-status-warning font-medium'
                                : 'text-muted-foreground'
                          }
                        >
                          {g.utilization}%
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(g.utilization, 100)}%`,
                            backgroundColor: g.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* CONFIGURATION TAB */}
        <TabsContent value="configuration" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Default Patterns */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Standaard Capaciteitspatronen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {machineGroups.map((group) => {
                  const groupMachines = Array.from(machineConfigs.values()).filter(
                    (m) => m.groupId === group.id
                  );
                  const staffing = groupStaffing.get(group.id) || group.staffingPercentage;

                  return (
                    <div key={group.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm" style={{ color: group.color }}>
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Bezetting %</Label>
                          <Input
                            type="number"
                            value={staffing}
                            onChange={(e) =>
                              updateGroupStaffing(group.id, Number(e.target.value))
                            }
                            className="h-7 w-16 text-xs"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {groupMachines.map((machine) => {
                          const config = machineConfigs.get(machine.id)!;
                          return (
                            <div
                              key={machine.id}
                              className="grid grid-cols-[1fr_auto_auto] gap-2 items-center bg-muted/30 p-2 rounded text-xs"
                            >
                              <div className="font-medium">{machine.name}</div>
                              <div className="flex items-center gap-1">
                                <Label className="text-xs">Cap %</Label>
                                <Input
                                  type="number"
                                  value={config.capacityModifier}
                                  onChange={(e) =>
                                    updateMachineConfig(machine.id, {
                                      capacityModifier: Number(e.target.value),
                                    })
                                  }
                                  className="h-7 w-16 text-xs"
                                  min="1"
                                  max="100"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Label className="text-xs">Ploegen</Label>
                                <Input
                                  type="number"
                                  value={config.shiftCount}
                                  onChange={(e) =>
                                    updateMachineConfig(machine.id, {
                                      shiftCount: Number(e.target.value),
                                    })
                                  }
                                  className="h-7 w-16 text-xs"
                                  min="1"
                                  max="3"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Period Overrides */}
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Periode-specifieke Aanpassingen</CardTitle>
                  <Button size="sm" onClick={handleNewOverride} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Toevoegen
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overrideList.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Geen periode-specifieke aanpassingen geconfigureerd.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Machine</TableHead>
                            <TableHead className="text-xs h-8">Periode</TableHead>
                            <TableHead className="text-xs h-8">Cap %</TableHead>
                            <TableHead className="text-xs h-8">Ploegen</TableHead>
                            <TableHead className="text-xs h-8 w-20">Acties</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overrideList.map((override) => {
                            const machine = machineConfigs.get(override.machineId);
                            return (
                              <TableRow key={override.id}>
                                <TableCell className="text-xs py-2">
                                  {machine?.name}
                                </TableCell>
                                <TableCell className="text-xs py-2">
                                  <div className="flex flex-col">
                                    <span>{override.startDate}</span>
                                    <span className="text-muted-foreground">
                                      tot {override.endDate}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs py-2">
                                  {override.capacityModifier}%
                                </TableCell>
                                <TableCell className="text-xs py-2">
                                  {override.shiftCount}
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setEditingOverride(override);
                                        setOverrideDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive"
                                      onClick={() =>
                                        handleDeleteOverride(override.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Staffing Overrides */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Bezetting Aanpassingen (per Groep)</CardTitle>
                  <Button size="sm" onClick={handleNewStaffingOverride} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Toevoegen
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {staffingOverrideList.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Geen bezetting aanpassingen geconfigureerd.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Groep</TableHead>
                            <TableHead className="text-xs h-8">Periode</TableHead>
                            <TableHead className="text-xs h-8">Bezetting %</TableHead>
                            <TableHead className="text-xs h-8">Reden</TableHead>
                            <TableHead className="text-xs h-8 w-20">Acties</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staffingOverrideList.map((override) => {
                            const group = machineGroups.find(
                              (g) => g.id === override.groupId
                            );
                            return (
                              <TableRow key={override.id}>
                                <TableCell className="text-xs py-2">
                                  {group?.name}
                                </TableCell>
                                <TableCell className="text-xs py-2">
                                  <div className="flex flex-col">
                                    <span>{override.startDate}</span>
                                    <span className="text-muted-foreground">
                                      tot {override.endDate}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs py-2">
                                  {override.staffingPercentage}%
                                </TableCell>
                                <TableCell className="text-xs py-2">
                                  {override.reason || '-'}
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setEditingStaffingOverride(override);
                                        setStaffingOverrideDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive"
                                      onClick={() =>
                                        handleDeleteStaffingOverride(
                                          override.id
                                        )
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOverride?.id.startsWith('new-') ? 'Nieuwe' : 'Bewerk'} Periode-specifieke Aanpassing
            </DialogTitle>
          </DialogHeader>
          {editingOverride && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Machine</Label>
                <Select
                  value={editingOverride.machineId}
                  onValueChange={(v) => setEditingOverride({ ...editingOverride, machineId: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(machineConfigs.values()).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Startdatum</Label>
                  <Input
                    type="date"
                    value={editingOverride.startDate}
                    onChange={(e) =>
                      setEditingOverride({ ...editingOverride, startDate: e.target.value })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Einddatum</Label>
                  <Input
                    type="date"
                    value={editingOverride.endDate}
                    onChange={(e) =>
                      setEditingOverride({ ...editingOverride, endDate: e.target.value })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Capaciteitsmodifier %</Label>
                  <Input
                    type="number"
                    value={editingOverride.capacityModifier}
                    onChange={(e) =>
                      setEditingOverride({
                        ...editingOverride,
                        capacityModifier: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs mt-1"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label className="text-xs">Aantal Ploegen</Label>
                  <Input
                    type="number"
                    value={editingOverride.shiftCount}
                    onChange={(e) =>
                      setEditingOverride({
                        ...editingOverride,
                        shiftCount: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs mt-1"
                    min="1"
                    max="3"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Reden (optioneel)</Label>
                <Input
                  value={editingOverride.reason || ''}
                  onChange={(e) => setEditingOverride({ ...editingOverride, reason: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="bijv. Onderhoud, storing, extra capaciteit..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOverrideDialogOpen(false);
                setEditingOverride(null);
              }}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveOverride}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staffing Override Dialog */}
      <Dialog open={staffingOverrideDialogOpen} onOpenChange={setStaffingOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStaffingOverride?.id.startsWith('new-') ? 'Nieuwe' : 'Bewerk'} Bezetting Aanpassing
            </DialogTitle>
          </DialogHeader>
          {editingStaffingOverride && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Machinegroep</Label>
                <Select
                  value={editingStaffingOverride.groupId}
                  onValueChange={(v) =>
                    setEditingStaffingOverride({ ...editingStaffingOverride, groupId: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {machineGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Startdatum</Label>
                  <Input
                    type="date"
                    value={editingStaffingOverride.startDate}
                    onChange={(e) =>
                      setEditingStaffingOverride({
                        ...editingStaffingOverride,
                        startDate: e.target.value,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Einddatum</Label>
                  <Input
                    type="date"
                    value={editingStaffingOverride.endDate}
                    onChange={(e) =>
                      setEditingStaffingOverride({
                        ...editingStaffingOverride,
                        endDate: e.target.value,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Bezetting Percentage</Label>
                <Input
                  type="number"
                  value={editingStaffingOverride.staffingPercentage}
                  onChange={(e) =>
                    setEditingStaffingOverride({
                      ...editingStaffingOverride,
                      staffingPercentage: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs mt-1"
                  min="1"
                  max="200"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  100% = normale bezetting, {'<'}100% = minder personeel, {'>'}100% = extra personeel
                </p>
              </div>

              <div>
                <Label className="text-xs">Reden (optioneel)</Label>
                <Input
                  value={editingStaffingOverride.reason || ''}
                  onChange={(e) =>
                    setEditingStaffingOverride({
                      ...editingStaffingOverride,
                      reason: e.target.value,
                    })
                  }
                  className="h-8 text-xs mt-1"
                  placeholder="bijv. Vakantieperiode, extra inzet, ziekte..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStaffingOverrideDialogOpen(false);
                setEditingStaffingOverride(null);
              }}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveStaffingOverride}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
