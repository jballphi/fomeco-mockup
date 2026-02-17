import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  X,
  PackageCheck,
  PackageX,
  PackageMinus,
  Table as TableIcon,
  LayoutGrid,
  Check,
  ChevronsUpDown,
  Send,
  AlertCircle,
  ParkingSquare,
  ArrowRight,
} from 'lucide-react';
import {
  schedulerOrders as initialOrders,
  machines,
  machineGroups,
  getSetupTime,
  type SchedulerOrder,
  type ProductType,
  type OrderStatus,
} from '@/data/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const statusColors: Record<string, string> = {
  planned: 'bg-primary',
  locked: 'bg-status-ok',
  'near-deadline': 'bg-status-warning',
  late: 'bg-status-danger',
  parked: 'bg-muted',
};

const statusLabels: Record<string, string> = {
  planned: 'Gepland',
  locked: 'Vergrendeld',
  'near-deadline': 'Bijna deadline',
  late: 'Te laat',
  parked: 'Geparkeerd',
};

interface SetupBlock {
  id: string;
  machine: string;
  startHour: number;
  durationHours: number;
  fromType: ProductType;
  toType: ProductType;
  setupHours: number;
}

interface StockIssue {
  orderId: string;
  orderNumber: string;
  material: string;
  required: number;
  available: number;
  shortage: number;
  type: 'error' | 'warning'; // error: no indication of resolution, warning: satisfied by earlier order
  resolvedByOrder?: string;
}

// Helper to format date from hour offset
function formatDate(baseDate: Date, hourOffset: number): string {
  const d = new Date(baseDate);
  d.setTime(d.getTime() + hourOffset * 60 * 60 * 1000);
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
}

// Helper to format hour as day + time
function formatHourLabel(hourOffset: number): string {
  const days = Math.floor(hourOffset / 24);
  const hours = hourOffset % 24;
  return `D${days} ${hours.toString().padStart(2, '0')}:00`;
}

export default function Planbord() {
  // State management
  const [orders, setOrders] = useState<SchedulerOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<SchedulerOrder | null>(null);
  const [showLateOnly, setShowLateOnly] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all-machines');
  const [filterOrderNumber, setFilterOrderNumber] = useState<string>('');
  const [viewMode, setViewMode] = useState<'gantt' | 'table'>('gantt');
  const [drawerOrder, setDrawerOrder] = useState<SchedulerOrder | null>(null);
  const [draggedOrder, setDraggedOrder] = useState<SchedulerOrder | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [dragPreviewHour, setDragPreviewHour] = useState<number | null>(null);
  const [dragPreviewMachine, setDragPreviewMachine] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const ganttChartRef = useRef<HTMLDivElement>(null);

  // Purge all dialog state
  const [purgeAllDialogOpen, setPurgeAllDialogOpen] = useState(false);
  const [purgeStartDate, setPurgeStartDate] = useState<string>('');
  const [purgeStartTime, setPurgeStartTime] = useState<string>('00:00');
  const [purgeEndDate, setPurgeEndDate] = useState<string>('');
  const [purgeEndTime, setPurgeEndTime] = useState<string>('23:59');
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);

  // Submit dialog state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitComment, setSubmitComment] = useState<string>('');

  // Parking drawer state
  const [parkingDrawerOpen, setParkingDrawerOpen] = useState(false);

  // Date range configuration (in hours) - LIMITED TO 2 WEEKS MAX, 1 WEEK DEFAULT
  const [startDate, setStartDate] = useState(new Date(2026, 1, 16)); // Feb 16, 2026
  const [hoursToShow, setHoursToShow] = useState(7 * 24); // 1 week default in hours
  
  // Initialize purge dialog dates when opened
  useEffect(() => {
    if (purgeAllDialogOpen && !purgeStartDate) {
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(end.getDate() + Math.floor(hoursToShow / 24));
      
      setPurgeStartDate(start.toISOString().split('T')[0]);
      setPurgeEndDate(end.toISOString().split('T')[0]);
    }
  }, [purgeAllDialogOpen, startDate, hoursToShow, purgeStartDate]);
  
  // Convert date/time to hour offset from startDate
  const dateTimeToHours = (dateStr: string, timeStr: string): number => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hours, minutes);
    const diffMs = targetDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  // Multi-select for machine groups
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // CTRL+scroll zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setHoursToShow((prev) => {
      const newHours = Math.round(prev * zoomFactor);
      // Limit between 1 day and 2 weeks (PLANBORD SPECIFIC)
      return Math.max(24, Math.min(14 * 24, newHours));
    });
  }, []);

  // Attach wheel event listener for zoom
  useEffect(() => {
    const ganttElement = ganttChartRef.current;
    if (ganttElement) {
      ganttElement.addEventListener('wheel', handleWheel as any, { passive: false });
      return () => ganttElement.removeEventListener('wheel', handleWheel as any);
    }
  }, [handleWheel]);

  // Calculate setup blocks based on order sequence per machine
  const setupBlocks = useMemo<SetupBlock[]>(() => {
    const blocks: SetupBlock[] = [];
    const machineOrderMap = new Map<string, SchedulerOrder[]>();

    orders.forEach((order) => {
      if (!machineOrderMap.has(order.machine)) {
        machineOrderMap.set(order.machine, []);
      }
      machineOrderMap.get(order.machine)!.push(order);
    });

    machineOrderMap.forEach((machineOrders, machine) => {
      const sorted = machineOrders.sort((a, b) => a.startHour - b.startHour);

      for (let i = 1; i < sorted.length; i++) {
        const prevOrder = sorted[i - 1];
        const currOrder = sorted[i];

        if (prevOrder.productType !== currOrder.productType) {
          const setupHours = getSetupTime(prevOrder.productType, currOrder.productType);
          const setupStartHour = prevOrder.startHour + prevOrder.durationHours;

          blocks.push({
            id: `setup-${prevOrder.id}-${currOrder.id}`,
            machine,
            startHour: setupStartHour,
            durationHours: setupHours,
            fromType: prevOrder.productType,
            toType: currOrder.productType,
            setupHours,
          });
        }
      }
    });

    return blocks;
  }, [orders]);

  // Generate timeline columns (show in day increments, but track hours internally)
  // When zoomed to 3 days or less, switch to hourly view
  const timelineColumns = useMemo(() => {
    const showHourly = hoursToShow <= 72; // 3 days or less
    
    if (showHourly) {
      // Generate hourly columns
      const hoursToDisplay = Math.ceil(hoursToShow);
      return Array.from({ length: hoursToDisplay }, (_, i) => {
        const d = new Date(startDate);
        d.setHours(d.getHours() + i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        return {
          label: `${d.getHours().toString().padStart(2, '0')}:00`,
          dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), // Date without time for grouping
          dayIndex: Math.floor(i / 24),
          hourOffset: i,
          isWeekend,
          isHourly: true,
        };
      });
    } else {
      // Generate daily columns (original behavior)
      const daysToShow = Math.ceil(hoursToShow / 24);
      return Array.from({ length: daysToShow }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return {
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          dateLabel: '',
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          dayIndex: i,
          hourOffset: i * 24,
          isWeekend: d.getDay() === 0 || d.getDay() === 6,
          isHourly: false,
        };
      });
    }
  }, [startDate, hoursToShow]);
  
  // Group timeline columns by date (for hourly view)
  const timelineGroups = useMemo(() => {
    if (!timelineColumns[0]?.isHourly) return [];
    
    const groups: Array<{
      dateLabel: string;
      date: Date;
      columns: typeof timelineColumns;
      isWeekend: boolean;
    }> = [];
    
    timelineColumns.forEach((col) => {
      const lastGroup = groups[groups.length - 1];
      const colDateStr = col.date.toISOString().split('T')[0];
      const lastDateStr = lastGroup?.date.toISOString().split('T')[0];
      
      if (!lastGroup || colDateStr !== lastDateStr) {
        groups.push({
          dateLabel: col.dateLabel,
          date: col.date,
          columns: [col],
          isWeekend: col.isWeekend,
        });
      } else {
        lastGroup.columns.push(col);
      }
    });
    
    return groups;
  }, [timelineColumns]);

  // Stock validation - PLANBORD SPECIFIC
  const stockIssues = useMemo<StockIssue[]>(() => {
    const issues: StockIssue[] = [];
    const materialStock = new Map<string, number>();
    
    // Initialize mock stock levels (increased to reduce shortage frequency)
    materialStock.set('STEEL_TUBE_50MM', 5000);
    materialStock.set('STEEL_TUBE_60MM', 3000);
    materialStock.set('STEEL_TUBE_75MM', 2000);
    materialStock.set('WELD_ROD', 1000);
    
    // Track incoming materials from orders
    const incomingMaterials = new Map<string, Array<{ orderId: string; orderNumber: string; amount: number; hour: number }>>();
    
    // Sort orders by start time
    const sortedOrders = [...orders].sort((a, b) => a.startHour - b.startHour);
    
    sortedOrders.forEach((order) => {
      // Mock material requirements based on product type
      let materialNeeded = '';
      let amountNeeded = 0;
      let amountProduced = 0;
      
      switch (order.productType) {
        case 'TYPE_A':
          materialNeeded = 'STEEL_TUBE_50MM';
          amountNeeded = order.quantity * 0.8; // Reduced consumption
          amountProduced = order.quantity; // Produces STEEL_TUBE_60MM
          break;
        case 'TYPE_B':
          materialNeeded = 'STEEL_TUBE_60MM';
          amountNeeded = order.quantity * 0.6; // Reduced consumption
          amountProduced = order.quantity;
          break;
        case 'TYPE_C':
          materialNeeded = 'STEEL_TUBE_75MM';
          amountNeeded = order.quantity * 1.2; // Reduced consumption
          break;
        case 'TYPE_D':
          materialNeeded = 'WELD_ROD';
          amountNeeded = order.quantity * 0.3; // Reduced consumption
          break;
      }
      
      const currentStock = materialStock.get(materialNeeded) || 0;
      
      if (currentStock < amountNeeded) {
        const shortage = amountNeeded - currentStock;
        
        // Check if shortage will be resolved by an earlier order
        const incoming = incomingMaterials.get(materialNeeded) || [];
        const resolvedBy = incoming.find(inc => inc.hour < order.startHour && inc.amount >= shortage);
        
        issues.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          material: materialNeeded,
          required: amountNeeded,
          available: currentStock,
          shortage,
          type: resolvedBy ? 'warning' : 'error',
          resolvedByOrder: resolvedBy?.orderNumber,
        });
      }
      
      // Consume material
      materialStock.set(materialNeeded, currentStock - amountNeeded);
      
      // Add produced material as incoming for downstream orders
      if (amountProduced > 0 && order.productType === 'TYPE_A') {
        if (!incomingMaterials.has('STEEL_TUBE_60MM')) {
          incomingMaterials.set('STEEL_TUBE_60MM', []);
        }
        incomingMaterials.get('STEEL_TUBE_60MM')!.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: amountProduced,
          hour: order.startHour + order.durationHours,
        });
      }
    });
    
    return issues;
  }, [orders]);

  // Separate parked and active orders
  const parkedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'parked');
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'parked');
  }, [orders]);

  // Apply filters and only show orders within visible timerange
  const filteredOrders = useMemo(() => {
    let filtered = activeOrders.filter((o) => {
      // Filter out orders completely outside visible range
      const orderEndHour = o.startHour + o.durationHours;
      return o.startHour < hoursToShow && orderEndHour > 0;
    });

    if (showLateOnly) {
      filtered = filtered.filter((o) => o.status === 'late' || o.status === 'near-deadline');
    }

    if (filterGroup !== 'all') {
      const groupMachines = machines.filter((m) => m.groupId === filterGroup).map((m) => m.name);
      filtered = filtered.filter((o) => groupMachines.includes(o.machine));
    }

    if (filterMachine !== 'all-machines') {
      filtered = filtered.filter((o) => o.machine === filterMachine);
    }

    if (filterOrderNumber.trim()) {
      filtered = filtered.filter((o) =>
        o.orderNumber.toLowerCase().includes(filterOrderNumber.toLowerCase())
      );
    }

    return filtered;
  }, [activeOrders, hoursToShow, showLateOnly, filterGroup, filterMachine, filterOrderNumber]);

  // Get machine options based on selected group(s)
  const availableMachines = useMemo(() => {
    if (selectedGroups.length === 0) return machines;
    return machines.filter((m) => selectedGroups.includes(m.groupId));
  }, [selectedGroups]);

  // Filter machines based on filters
  const filteredMachines = useMemo(() => {
    let result = machines;

    if (selectedGroups.length > 0) {
      result = result.filter((m) => selectedGroups.includes(m.groupId));
    }

    if (filterMachine !== 'all-machines') {
      result = result.filter((m) => m.name === filterMachine);
    }

    return result;
  }, [filterMachine, selectedGroups]);

  // Get flow of related orders (same parent order number)
  const orderFlow = useMemo(() => {
    if (!selectedOrder) return [];
    const parentOrderNumber = selectedOrder.orderNumber.split('-')[0];
    return orders.filter((o) => o.orderNumber.startsWith(parentOrderNumber));
  }, [selectedOrder, orders]);

  // Order manipulation handlers
  const handleDeleteOrder = useCallback((order: SchedulerOrder) => {
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    if (selectedOrder?.id === order.id) setSelectedOrder(null);
  }, [selectedOrder]);

  const handleToggleLock = useCallback((order: SchedulerOrder) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, status: o.status === 'locked' ? 'planned' : 'locked' }
          : o
      )
    );
    if (selectedOrder?.id === order.id) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: prev.status === 'locked' ? 'planned' : 'locked' } : null
      );
    }
  }, [selectedOrder]);

  // Park order (move to parking lane)
  const handleParkOrder = useCallback(
    (order: SchedulerOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'parked' as OrderStatus } : o))
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'parked' as OrderStatus } : null));
      }
    },
    [selectedOrder]
  );

  // Unpark order (restore to planning with default status)
  const handleUnparkOrder = useCallback(
    (order: SchedulerOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'planned' as OrderStatus } : o))
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'planned' as OrderStatus } : null));
      }
    },
    [selectedOrder]
  );

  // Purge order (compact)
  const handlePurgeOrder = useCallback((order: SchedulerOrder) => {
    setOrders((prev) => {
      const newOrders = [...prev];
      const machine = order.machine;
      const machineOrders = newOrders
        .filter((o) => o.machine === machine && o.startHour >= order.startHour && o.status !== 'locked')
        .sort((a, b) => a.startHour - b.startHour);

      let currentHour = order.startHour;
      let lastProductType: ProductType | null = null;

      const beforeOrders = newOrders
        .filter((o) => o.machine === machine && o.startHour < order.startHour)
        .sort((a, b) => b.startHour - a.startHour);

      if (beforeOrders.length > 0) {
        currentHour = beforeOrders[0].startHour + beforeOrders[0].durationHours;
        lastProductType = beforeOrders[0].productType;
      }

      machineOrders.forEach((o) => {
        if (lastProductType && lastProductType !== o.productType) {
          const setupHours = getSetupTime(lastProductType, o.productType);
          currentHour += setupHours;
        }

        const orderInArray = newOrders.find((x) => x.id === o.id);
        if (orderInArray) {
          orderInArray.startHour = currentHour;
          currentHour += o.durationHours;
          lastProductType = o.productType;
        }
      });

      return newOrders;
    });
  }, []);

  // Purge all orders in selected machines within timeframe
  const handlePurgeAll = useCallback(() => {
    const purgeStartHour = dateTimeToHours(purgeStartDate, purgeStartTime);
    const purgeEndHour = dateTimeToHours(purgeEndDate, purgeEndTime);
    
    setOrders((prev) => {
      const newOrders = [...prev];

      selectedMachines.forEach((machineName) => {
        const machineOrders = newOrders
          .filter(
            (o) =>
              o.machine === machineName &&
              o.startHour >= purgeStartHour &&
              o.startHour <= purgeEndHour &&
              o.status !== 'locked'
          )
          .sort((a, b) => a.startHour - b.startHour);

        let currentHour = purgeStartHour;
        let lastProductType: ProductType | null = null;

        // Find last order before timeframe to get last product type
        const beforeOrders = newOrders
          .filter((o) => o.machine === machineName && o.startHour < purgeStartHour)
          .sort((a, b) => b.startHour - a.startHour);

        if (beforeOrders.length > 0) {
          currentHour = beforeOrders[0].startHour + beforeOrders[0].durationHours;
          lastProductType = beforeOrders[0].productType;
        }

        machineOrders.forEach((order) => {
          // Add setup time if needed
          if (lastProductType && lastProductType !== order.productType) {
            const setupHours = getSetupTime(lastProductType, order.productType);
            currentHour += setupHours;
          }

          const orderInArray = newOrders.find((o) => o.id === order.id);
          if (orderInArray) {
            orderInArray.startHour = currentHour;
            currentHour += order.durationHours;
            lastProductType = order.productType;
          }
        });
      });

      return newOrders;
    });

    setPurgeAllDialogOpen(false);
    setSelectedMachines([]);
  }, [selectedMachines, purgeStartDate, purgeStartTime, purgeEndDate, purgeEndTime, dateTimeToHours]);

  // Handle submit planning - PLANBORD SPECIFIC
  const handleSubmitPlanning = useCallback(() => {
    const hasErrors = stockIssues.some(issue => issue.type === 'error');
    const hasWarnings = stockIssues.some(issue => issue.type === 'warning');
    
    if ((hasErrors || hasWarnings) && !submitComment.trim()) {
      alert('Voer een toelichting in voor het goedkeuren van de planning ondanks voorraadtekorten.');
      return;
    }
    
    // Mock submission
    alert(`Planning succesvol ingediend naar ERP systeem!\n\n${(hasErrors || hasWarnings) ? `Toelichting: ${submitComment}` : 'Geen voorraadproblemen gedetecteerd.'}`);
    setSubmitDialogOpen(false);
    setSubmitComment('');
  }, [stockIssues, submitComment]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, order: SchedulerOrder) => {
    if (order.status === 'locked') return;
    setDraggedOrder(order);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset(e.clientX - rect.left);
  };

  const handleDragOver = (e: React.DragEvent, machine: string) => {
    e.preventDefault();
    if (!draggedOrder || draggedOrder.status === 'locked') return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentX = x / rect.width;
    const previewHour = Math.max(0, Math.floor(percentX * hoursToShow));

    setDragPreviewHour(previewHour);
    setDragPreviewMachine(machine);
  };

  const handleDrop = (e: React.DragEvent, targetMachine: string) => {
    e.preventDefault();
    if (!draggedOrder || draggedOrder.status === 'locked') return;
    if (draggedOrder.machine !== targetMachine) {
      setDraggedOrder(null);
      setDragPreviewHour(null);
      setDragPreviewMachine(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset;
    const percentX = x / rect.width;
    const newStartHour = Math.max(0, Math.floor(percentX * hoursToShow));

    setOrders((prev) => {
      const newOrders = [...prev];
      const orderIndex = newOrders.findIndex((o) => o.id === draggedOrder.id);
      if (orderIndex === -1) return prev;

      const movedOrder = newOrders[orderIndex];
      movedOrder.startHour = newStartHour;

      const machineOrders = newOrders
        .filter((o) => o.machine === targetMachine && o.status !== 'locked')
        .sort((a, b) => a.startHour - b.startHour);

      let currentHour = 0;
      let lastProductType: ProductType | null = null;

      const firstLockedOrScheduledBefore = newOrders
        .filter((o) => o.machine === targetMachine && o.startHour < newStartHour)
        .sort((a, b) => b.startHour - a.startHour)[0];

      if (firstLockedOrScheduledBefore) {
        currentHour = firstLockedOrScheduledBefore.startHour + firstLockedOrScheduledBefore.durationHours;
        lastProductType = firstLockedOrScheduledBefore.productType;
      }

      machineOrders.forEach((order) => {
        if (lastProductType && lastProductType !== order.productType) {
          const setupHours = getSetupTime(lastProductType, order.productType);
          currentHour += setupHours;
        }

        const orderInArray = newOrders.find((o) => o.id === order.id);
        if (orderInArray && orderInArray.status !== 'locked') {
          orderInArray.startHour = currentHour;
          currentHour += order.durationHours;
          lastProductType = order.productType;
        }
      });

      return newOrders;
    });

    setDraggedOrder(null);
    setDragPreviewHour(null);
    setDragPreviewMachine(null);
  };

  // Manual time editing
  const handleManualTimeEdit = useCallback((order: SchedulerOrder, newStartHour: number) => {
    setOrders((prev) => {
      return prev.map((o) => (o.id === order.id ? { ...o, startHour: newStartHour } : o));
    });
  }, []);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header card */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Planbord — Detailplanning</h1>
              
              {/* Stock status indicators - PLANBORD SPECIFIC */}
              <div className="flex items-center gap-2">
                {stockIssues.length > 0 && (
                  <>
                    {stockIssues.some(i => i.type === 'error') && (
                      <Badge variant="outline" className="gap-1.5 border-status-danger text-status-danger">
                        <AlertCircle className="h-3 w-3" />
                        {stockIssues.filter(i => i.type === 'error').length} Voorraad Tekort
                      </Badge>
                    )}
                    {stockIssues.some(i => i.type === 'warning') && (
                      <Badge variant="outline" className="gap-1.5 border-status-warning text-status-warning">
                        <AlertTriangle className="h-3 w-3" />
                        {stockIssues.filter(i => i.type === 'warning').length} Waarschuwing
                      </Badge>
                    )}
                  </>
                )}
                {stockIssues.length === 0 && (
                  <Badge variant="outline" className="gap-1.5 border-status-ok text-status-ok">
                    <PackageCheck className="h-3 w-3" />
                    Voorraad OK
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Multi-select machine groups */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-48 justify-between text-xs">
                      <span className="truncate">
                        {selectedGroups.length === 0
                          ? 'Alle Machine Groepen'
                          : `${selectedGroups.length} geselecteerd`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-1">
                      {machineGroups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGroups((prev) => [...prev, group.id]);
                              } else {
                                setSelectedGroups((prev) => prev.filter((id) => id !== group.id));
                              }
                            }}
                          />
                          <Label htmlFor={`group-${group.id}`} className="text-xs cursor-pointer flex-1">
                            {group.name}
                          </Label>
                        </div>
                      ))}
                      {selectedGroups.length > 0 && (
                        <>
                          <Separator className="my-2" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setSelectedGroups([])}
                          >
                            Wis selectie
                          </Button>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Select value={filterMachine} onValueChange={setFilterMachine}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Filter machine..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-machines">Alle Machines</SelectItem>
                    {availableMachines.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Zoek ordernummer..."
                  value={filterOrderNumber}
                  onChange={(e) => setFilterOrderNumber(e.target.value)}
                  className="h-8 w-44 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-6" />
                <Select
                  value={(hoursToShow / 24).toString()}
                  onValueChange={(v) => setHoursToShow(parseInt(v) * 24)}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 Week</SelectItem>
                    <SelectItem value="14">2 Weken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => selectedOrder && handlePurgeOrder(selectedOrder)}
                  disabled={!selectedOrder || selectedOrder.status === 'locked'}
                >
                  <PackageMinus className="h-3 w-3" />
                  Opruimen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setPurgeAllDialogOpen(true)}
                >
                  <PackageMinus className="h-3 w-3" />
                  Alles Opruimen
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => selectedOrder && handleToggleLock(selectedOrder)}
                  disabled={!selectedOrder}
                >
                  {selectedOrder?.status === 'locked' ? (
                    <>
                      <Unlock className="h-3 w-3" />
                      Ontgrendelen
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Vergrendelen
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-destructive"
                  onClick={() => selectedOrder && handleDeleteOrder(selectedOrder)}
                  disabled={!selectedOrder}
                >
                  <Trash2 className="h-3 w-3" />
                  Verwijderen
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-5" />
                {/* Parking lane button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setParkingDrawerOpen(true)}
                >
                  <ParkingSquare className="h-3 w-3" />
                  Parkeerstrook ({parkedOrders.length})
                </Button>
                <Separator orientation="vertical" className="h-5" />
                {/* Submit planning button - PLANBORD SPECIFIC */}
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setSubmitDialogOpen(true)}
                >
                  <Send className="h-3 w-3" />
                  Indienen Planning
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <Button
                  variant={viewMode === 'gantt' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setViewMode('gantt')}
                >
                  <LayoutGrid className="h-3 w-3" />
                  Gantt
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="h-3 w-3" />
                  Tabel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock issues warning - PLANBORD SPECIFIC */}
      {stockIssues.length > 0 && (
        <Card className={`border-2 ${stockIssues.some(i => i.type === 'error') ? 'border-status-danger' : 'border-status-warning'}`}>
          <CardContent className="py-3 px-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {stockIssues.some(i => i.type === 'error') ? (
                  <AlertCircle className="h-4 w-4 text-status-danger" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-status-warning" />
                )}
                <span className="text-sm font-medium">Voorraadproblemen Gedetecteerd</span>
              </div>
              <div className="ml-6 space-y-1 text-xs">
                {stockIssues.slice(0, 5).map((issue) => (
                  <div key={issue.orderId} className="flex items-start gap-2">
                    <span className={`font-medium ${issue.type === 'error' ? 'text-status-danger' : 'text-status-warning'}`}>
                      {issue.orderNumber}:
                    </span>
                    <span className="flex-1">
                      {issue.material} tekort: {issue.shortage} stuks nodig (beschikbaar: {issue.available})
                      {issue.resolvedByOrder && (
                        <span className="text-muted-foreground"> — wordt opgelost door {issue.resolvedByOrder}</span>
                      )}
                    </span>
                  </div>
                ))}
                {stockIssues.length > 5 && (
                  <div className="text-muted-foreground italic">
                    +{stockIssues.length - 5} meer problemen...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content area */}
      {viewMode === 'gantt' ? (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Gantt chart */}
          <Card className="flex-1 overflow-auto" ref={ganttChartRef}>
            <div className="min-w-[1200px]">
              {/* Timeline header */}
              <div className="border-b border-border sticky top-0 bg-card z-10">
                {timelineGroups.length > 0 ? (
                  // Two-row header for hourly view
                  <>
                    {/* Date group row */}
                    <div className="flex border-b border-border">
                      <div className="w-40 shrink-0 border-r border-border p-2 text-xs font-medium text-muted-foreground">
                        Machine
                      </div>
                      <div className="flex-1 flex" ref={timelineRef}>
                        {timelineGroups.map((group, groupIndex) => (
                          <div
                            key={`group-${groupIndex}`}
                            className={`flex-1 text-center text-xs py-1.5 border-r border-border font-semibold ${
                              group.isWeekend ? 'bg-muted/50' : ''
                            } ${groupIndex === 0 ? 'text-primary' : 'text-foreground'}`}
                            style={{
                              flexBasis: `${(group.columns.length / timelineColumns.length) * 100}%`,
                              flexGrow: group.columns.length,
                            }}
                          >
                            {group.dateLabel}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Hour subdivisions row */}
                    <div className="flex">
                      <div className="w-40 shrink-0 border-r border-border"></div>
                      <div className="flex-1 flex">
                        {timelineColumns.map((col, index) => (
                          <div
                            key={`${col.hourOffset}-${index}`}
                            className={`flex-1 min-w-[32px] text-center text-[10px] py-1 border-r border-border ${
                              col.isWeekend ? 'bg-muted/50' : ''
                            } ${col.hourOffset === 0 ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                          >
                            {col.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  // Single-row header for daily view
                  <div className="flex">
                    <div className="w-40 shrink-0 border-r border-border p-2 text-xs font-medium text-muted-foreground">
                      Machine
                    </div>
                    <div className="flex-1 flex" ref={timelineRef}>
                      {timelineColumns.map((col, index) => (
                        <div
                          key={`${col.hourOffset}-${index}`}
                          className={`flex-1 min-w-[32px] text-center text-[10px] py-1.5 border-r border-border ${
                            col.isWeekend ? 'bg-muted/50' : ''
                          } ${col.hourOffset === 0 ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                        >
                          {col.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Machine rows */}
              {filteredMachines.map((machine) => {
                const machineOrders = filteredOrders.filter((o) => o.machine === machine.name);
                const machineSetups = setupBlocks.filter(
                  (s) => s.machine === machine.name && s.startHour < hoursToShow
                );

                return (
                  <div
                    key={machine.name}
                    className="flex border-b border-border hover:bg-muted/20 gantt-timeline"
                    onDragOver={(e) => handleDragOver(e, machine.name)}
                    onDrop={(e) => handleDrop(e, machine.name)}
                  >
                    <div className="w-40 shrink-0 border-r border-border p-2 text-xs font-medium flex items-center">
                      {machine.name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        ({machine.groupId})
                      </span>
                    </div>
                    <div className="flex-1 relative h-12">
                      {/* Weekend shading */}
                      {timelineColumns.map((col, index) =>
                        col.isWeekend ? (
                          <div
                            key={`weekend-${col.hourOffset}-${index}`}
                            className="absolute top-0 bottom-0 bg-muted/30 pointer-events-none"
                            style={{
                              left: `${(col.hourOffset / hoursToShow) * 100}%`,
                              width: `${((col.isHourly ? 1 : 24) / hoursToShow) * 100}%`,
                            }}
                          />
                        ) : null
                      )}
                      {/* Current time line (12 hours into timeline) */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none"
                        style={{ left: `${(12 / hoursToShow) * 100}%` }}
                      />

                      {/* Setup blocks */}
                      {machineSetups.map((setup) => (
                        <Tooltip key={setup.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-7 h-4 bg-muted border border-border rounded-sm flex items-center justify-center text-[9px] text-muted-foreground pointer-events-none"
                              style={{
                                left: `${(setup.startHour / hoursToShow) * 100}%`,
                                width: `${(setup.durationHours / hoursToShow) * 100}%`,
                              }}
                            >
                              <span className="truncate px-1">Omstelling</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <p className="font-medium">Omstelling vereist</p>
                            <p>
                              {setup.fromType} → {setup.toType}
                            </p>
                            <p>{setup.setupHours.toFixed(1)} uur</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}

                      {/* Order blocks */}
                      {machineOrders.map((order) => {
                        const isInSelectedFlow = orderFlow.some((o) => o.id === order.id);
                        const isSelected = selectedOrder?.id === order.id;
                        const isDimmed = selectedOrder && !isInSelectedFlow;
                        const isDragging = draggedOrder?.id === order.id;
                        const hasStockIssue = stockIssues.some(i => i.orderId === order.id);
                        const stockIssueType = stockIssues.find(i => i.orderId === order.id)?.type;
                        
                        // Truncate order blocks that extend past visible timeline
                        const visibleDuration = Math.min(
                          order.durationHours,
                          hoursToShow - order.startHour
                        );

                        return (
                          <Tooltip key={order.id}>
                            <TooltipTrigger asChild>
                              <div
                                draggable={order.status !== 'locked'}
                                onDragStart={(e) => handleDragStart(e, order)}
                                onClick={() => setSelectedOrder(order)}
                                className={`absolute top-1 h-6 rounded ${statusColors[order.status]} text-white text-[10px] px-1.5 flex items-center gap-1 cursor-pointer hover:opacity-90 transition-all truncate ${isDimmed ? 'opacity-30' : ''
                                  } ${isSelected ? 'ring-2 ring-white ring-offset-1' : ''} ${isDragging ? 'opacity-50' : ''
                                  } ${order.status !== 'locked' ? 'cursor-move' : 'cursor-default'} ${hasStockIssue ? 'ring-2 ring-offset-1' : ''} ${stockIssueType === 'error' ? 'ring-status-danger' : stockIssueType === 'warning' ? 'ring-status-warning' : ''}`}
                                style={{
                                  left: `${(order.startHour / hoursToShow) * 100}%`,
                                  width: `${(visibleDuration / hoursToShow) * 100}%`,
                                  zIndex: isInSelectedFlow ? 15 : 10,
                                }}
                              >
                                {order.status === 'locked' && (
                                  <Lock className="h-2.5 w-2.5 shrink-0" />
                                )}
                                {hasStockIssue && stockIssueType === 'error' && (
                                  <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                                )}
                                {hasStockIssue && stockIssueType === 'warning' && (
                                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                )}
                                <span className="truncate font-medium">
                                  {order.orderNumber}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              <p className="font-medium">
                                {order.orderNumber} — {order.operation}
                              </p>
                              <p>Type: {order.productType}</p>
                              <p>
                                {(order.durationHours / 8).toFixed(1)} dagen (
                                {order.durationHours}u) • Aantal: {order.quantity}
                              </p>
                              <p>Status: {statusLabels[order.status]}</p>
                              {hasStockIssue && (
                                <p className={`mt-1 ${stockIssueType === 'error' ? 'text-status-danger' : 'text-status-warning'}`}>
                                  Voorraadprobleem gedetecteerd
                                </p>
                              )}
                              {order.status !== 'locked' && (
                                <p className="text-muted-foreground mt-1">
                                  Versleep om te verplaatsen
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}

                      {/* Drag preview */}
                      {dragPreviewHour !== null &&
                        dragPreviewMachine === machine.name &&
                        draggedOrder && (
                          <div
                            className="absolute top-1 h-6 rounded border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
                            style={{
                              left: `${(dragPreviewHour / hoursToShow) * 100}%`,
                              width: `${(draggedOrder.durationHours / hoursToShow) * 100}%`,
                            }}
                          />
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Order detail panel */}
          {selectedOrder && (
            <Card className="w-80 shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedOrder.orderNumber}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedOrder.operation}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Machine:</span>
                    <span className="font-medium">{selectedOrder.machine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type Product:</span>
                    <span className="font-medium">{selectedOrder.productType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aantal:</span>
                    <span className="font-medium">{selectedOrder.quantity} stuks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duur:</span>
                    <span className="font-medium">
                      {selectedOrder.durationHours}u ({(selectedOrder.durationHours / 8).toFixed(1)} dagen)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={`${statusColors[selectedOrder.status]} text-white h-5 text-[10px]`}>
                      {statusLabels[selectedOrder.status]}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Manual time editor */}
                <div className="space-y-2">
                  <Label className="text-xs">Starttijd (uren vanaf begin)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedOrder.startHour}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        handleManualTimeEdit(selectedOrder, Math.max(0, newValue));
                        setSelectedOrder((prev) => prev ? { ...prev, startHour: newValue } : null);
                      }}
                      className="h-8 text-xs"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatHourLabel(selectedOrder.startHour)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Stock issues for this order - PLANBORD SPECIFIC */}
                {stockIssues.some(i => i.orderId === selectedOrder.id) && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-status-danger">Voorraadproblemen:</Label>
                      {stockIssues
                        .filter(i => i.orderId === selectedOrder.id)
                        .map((issue, idx) => (
                          <div key={idx} className={`p-2 rounded-md border ${issue.type === 'error' ? 'bg-status-danger/5 border-status-danger/30' : 'bg-status-warning/5 border-status-warning/30'}`}>
                            <div className="flex items-start gap-2 mb-1">
                              {issue.type === 'error' ? (
                                <AlertCircle className="h-3 w-3 text-status-danger shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-status-warning shrink-0 mt-0.5" />
                              )}
                              <div className="text-[11px] space-y-0.5">
                                <p className="font-medium">{issue.material}</p>
                                <p>Nodig: {issue.required}, Beschikbaar: {issue.available}</p>
                                <p className={issue.type === 'error' ? 'text-status-danger' : 'text-status-warning'}>
                                  Tekort: {issue.shortage} stuks
                                </p>
                                {issue.resolvedByOrder && (
                                  <p className="text-muted-foreground italic">
                                    Wordt opgelost door {issue.resolvedByOrder}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <Separator />
                  </>
                )}

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      handleToggleLock(selectedOrder);
                      setSelectedOrder((prev) =>
                        prev
                          ? { ...prev, status: prev.status === 'locked' ? 'planned' : 'locked' }
                          : null
                      );
                    }}
                  >
                    {selectedOrder.status === 'locked' ? (
                      <>
                        <Unlock className="h-4 w-4" /> Ontgrendelen
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" /> Vergrendelen
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handlePurgeOrder(selectedOrder)}
                    disabled={selectedOrder.status === 'locked'}
                  >
                    <PackageMinus className="h-4 w-4" /> Opruimen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      handleParkOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                  >
                    <ParkingSquare className="h-4 w-4" /> Parkeer Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-destructive"
                    onClick={() => {
                      handleDeleteOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Verwijderen
                  </Button>
                </div>

                <Separator />

                <div className="text-[11px] text-muted-foreground">
                  <p className="mb-1 font-medium">Related Orders:</p>
                  {orderFlow.length > 1 ? (
                    <ul className="space-y-0.5">
                      {orderFlow.map((o) => (
                        <li
                          key={o.id}
                          className={`cursor-pointer hover:text-foreground ${o.id === selectedOrder.id ? 'text-primary font-medium' : ''
                            }`}
                          onClick={() => setSelectedOrder(o)}
                        >
                          {o.orderNumber} — {o.machine}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic">No related orders</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Table view */
        <Card className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Operatie</TableHead>
                <TableHead className="text-xs">Machine</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Start</TableHead>
                <TableHead className="text-xs">Duur</TableHead>
                <TableHead className="text-xs">Aantal</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Voorraad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const hasStockIssue = stockIssues.some(i => i.orderId === order.id);
                const stockIssueType = stockIssues.find(i => i.orderId === order.id)?.type;
                
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="text-xs font-medium">{order.orderNumber}</TableCell>
                    <TableCell className="text-xs">{order.operation}</TableCell>
                    <TableCell className="text-xs">{order.machine}</TableCell>
                    <TableCell className="text-xs">{order.productType}</TableCell>
                    <TableCell className="text-xs">{formatHourLabel(order.startHour)}</TableCell>
                    <TableCell className="text-xs">{order.durationHours}u</TableCell>
                    <TableCell className="text-xs">{order.quantity}</TableCell>
                    <TableCell className="text-xs">
                      <Badge className={`${statusColors[order.status]} text-white h-5 text-[10px]`}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {hasStockIssue ? (
                        <Badge variant="outline" className={`h-5 text-[10px] ${stockIssueType === 'error' ? 'border-status-danger text-status-danger' : 'border-status-warning text-status-warning'}`}>
                          {stockIssueType === 'error' ? <AlertCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                          {stockIssueType === 'error' ? 'Tekort' : 'Waarschuwing'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 text-[10px] border-status-ok text-status-ok">
                          <PackageCheck className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Purge all dialog */}
      <Dialog open={purgeAllDialogOpen} onOpenChange={setPurgeAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alles Opruimen</DialogTitle>
            <DialogDescription>
              Selecteer machines en tijdsperiode om alle orders op te ruimen (niet-vergrendelde orders
              worden zo dicht mogelijk ingepland).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Machines</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border rounded-md p-3">
                {machines.map((machine) => (
                  <div key={machine.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`machine-${machine.name}`}
                      checked={selectedMachines.includes(machine.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMachines((prev) => [...prev, machine.name]);
                        } else {
                          setSelectedMachines((prev) =>
                            prev.filter((m) => m !== machine.name)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`machine-${machine.name}`} className="text-xs cursor-pointer">
                      {machine.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purge-start-date">Startdatum</Label>
                <Input
                  id="purge-start-date"
                  type="date"
                  value={purgeStartDate}
                  onChange={(e) => setPurgeStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purge-start-time">Starttijd</Label>
                <Input
                  id="purge-start-time"
                  type="time"
                  value={purgeStartTime}
                  onChange={(e) => setPurgeStartTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purge-end-date">Einddatum</Label>
                <Input
                  id="purge-end-date"
                  type="date"
                  value={purgeEndDate}
                  onChange={(e) => setPurgeEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purge-end-time">Eindtijd</Label>
                <Input
                  id="purge-end-time"
                  type="time"
                  value={purgeEndTime}
                  onChange={(e) => setPurgeEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeAllDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handlePurgeAll} disabled={selectedMachines.length === 0}>
              Opruimen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit planning dialog - PLANBORD SPECIFIC */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planning Indienen</DialogTitle>
            <DialogDescription>
              Bevestig het indienen van de planning naar het ERP systeem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {stockIssues.length > 0 && (
              <>
                <div className={`p-3 rounded-md border ${stockIssues.some(i => i.type === 'error') ? 'bg-status-danger/5 border-status-danger' : 'bg-status-warning/5 border-status-warning'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {stockIssues.some(i => i.type === 'error') ? (
                      <AlertCircle className="h-4 w-4 text-status-danger shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
                    )}
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Let op: Voorraadproblemen gedetecteerd</p>
                      <p className="text-xs text-muted-foreground">
                        {stockIssues.filter(i => i.type === 'error').length} tekorten, {stockIssues.filter(i => i.type === 'warning').length} waarschuwingen
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submit-comment" className="text-sm font-medium">
                    Toelichting <span className="text-status-danger">*</span>
                  </Label>
                  <Textarea
                    id="submit-comment"
                    placeholder="Geef een reden voor het goedkeuren van deze planning ondanks voorraadtekorten..."
                    value={submitComment}
                    onChange={(e) => setSubmitComment(e.target.value)}
                    className="text-xs min-h-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Een toelichting is verplicht bij voorraadproblemen.
                  </p>
                </div>
              </>
            )}
            {stockIssues.length === 0 && (
              <div className="p-3 rounded-md border bg-status-ok/5 border-status-ok/30">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-status-ok" />
                  <p className="text-sm">Geen voorraadproblemen gedetecteerd. Planning kan worden ingediend.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSubmitDialogOpen(false);
              setSubmitComment('');
            }}>
              Annuleren
            </Button>
            <Button onClick={handleSubmitPlanning}>
              <Send className="h-4 w-4 mr-2" />
              Indienen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parkeerstrook (Parking Lane) Drawer */}
      <Sheet open={parkingDrawerOpen} onOpenChange={setParkingDrawerOpen}>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ParkingSquare className="h-5 w-5" />
              Parkeerstrook ({parkedOrders.length})
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {parkedOrders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ParkingSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Geen geparkeerde orders</p>
              </div>
            ) : (
              parkedOrders.map((order) => (
                <Card key={order.id} className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          Order {order.orderNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.operation}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-muted shrink-0">
                        {statusLabels.parked}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="text-muted-foreground">Producttype:</div>
                      <div className="font-medium">{order.productType}</div>
                      <div className="text-muted-foreground">Hoeveelheid:</div>
                      <div className="font-medium">{order.quantity.toLocaleString()} st</div>
                      <div className="text-muted-foreground">Machine:</div>
                      <div className="font-medium">{order.machine}</div>
                      <div className="text-muted-foreground">Deadline:</div>
                      <div className="font-medium">
                        {new Date(order.deadline).toLocaleDateString('nl-NL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleUnparkOrder(order)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Terugplaatsen
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
