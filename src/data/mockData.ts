// ===== RCCP DATA =====

export interface CapacityOverride {
  id: string;
  machineId: string;
  startDate: string;
  endDate: string;
  capacityModifier: number;
  shiftCount: number;
  reason?: string;
}

export interface StaffingOverride {
  id: string;
  groupId: string;
  startDate: string;
  endDate: string;
  staffingPercentage: number;
  reason?: string;
}

export interface Machine {
  id: string;
  name: string;
  groupId: string;
  capacityModifier: number; // percentage (e.g., 80 means 80% efficiency) - default pattern
  shiftCount: number; // default pattern
}

export interface MachineGroup {
  id: string;
  name: string;
  utilization: number;
  status: "ok" | "warning" | "danger";
  staffingPercentage: number;
  color: string;
}

// Mock capacity overrides - periods where machines have different configurations
export const capacityOverrides: CapacityOverride[] = [
  { 
    id: "override-1", 
    machineId: "buig-1", 
    startDate: "2026-03-01", 
    endDate: "2026-03-14", 
    capacityModifier: 60, 
    shiftCount: 1,
    reason: "Onderhoud gepland"
  },
  { 
    id: "override-2", 
    machineId: "lasrobot-1", 
    startDate: "2026-02-24", 
    endDate: "2026-02-28", 
    capacityModifier: 50, 
    shiftCount: 1,
    reason: "Technische storing"
  },
  { 
    id: "override-3", 
    machineId: "hydro-2", 
    startDate: "2026-04-01", 
    endDate: "2026-04-07", 
    capacityModifier: 100, 
    shiftCount: 3,
    reason: "Extra ploeg voor inhaalslag"
  },
];

// Mock staffing overrides - periods where groups have different staffing levels
export const staffingOverrides: StaffingOverride[] = [
  {
    id: "staffing-1",
    groupId: "lasrobot",
    startDate: "2026-03-10",
    endDate: "2026-03-24",
    staffingPercentage: 70,
    reason: "Vakantieperiode - beperkte bezetting"
  },
  {
    id: "staffing-2",
    groupId: "buig",
    startDate: "2026-04-01",
    endDate: "2026-04-14",
    staffingPercentage: 110,
    reason: "Extra personeel ingezet"
  },
];

export const machineGroups: MachineGroup[] = [
  { id: "buig", name: "BUIG", utilization: 87, status: "ok", staffingPercentage: 95, color: "hsl(214 80% 52%)" },
  { id: "lasrobot", name: "LASROBOT", utilization: 102, status: "danger", staffingPercentage: 90, color: "hsl(0 72% 51%)" },
  { id: "las", name: "LAS", utilization: 91, status: "warning", staffingPercentage: 85, color: "hsl(38 92% 50%)" },
  { id: "hydro", name: "HYDRO", utilization: 78, status: "ok", staffingPercentage: 95, color: "hsl(262 83% 58%)" },
  { id: "assemblage", name: "ASSEMBLAGE", utilization: 65, status: "ok", staffingPercentage: 100, color: "hsl(142 76% 36%)" },
  { id: "leaktest", name: "LEAKTEST", utilization: 73, status: "ok", staffingPercentage: 90, color: "hsl(173 80% 40%)" },
];

export const machines: Machine[] = [
  // BUIG machines
  { id: "buig-1", name: "BUIG 1", groupId: "buig", capacityModifier: 85, shiftCount: 2 },
  { id: "buig-2", name: "BUIG 2", groupId: "buig", capacityModifier: 90, shiftCount: 2 },
  { id: "buig-3", name: "BUIG 3", groupId: "buig", capacityModifier: 80, shiftCount: 1 },
  
  // LASROBOT machines
  { id: "lasrobot-1", name: "LASROBOT 1", groupId: "lasrobot", capacityModifier: 95, shiftCount: 3 },
  { id: "lasrobot-2", name: "LASROBOT 2", groupId: "lasrobot", capacityModifier: 88, shiftCount: 2 },
  
  // LAS machines
  { id: "las-1", name: "LAS 1", groupId: "las", capacityModifier: 80, shiftCount: 2 },
  { id: "las-2", name: "LAS 2", groupId: "las", capacityModifier: 85, shiftCount: 2 },
  { id: "las-3", name: "LAS 3", groupId: "las", capacityModifier: 90, shiftCount: 1 },
  
  // HYDRO machines
  { id: "hydro-1", name: "HYDRO 1", groupId: "hydro", capacityModifier: 92, shiftCount: 2 },
  { id: "hydro-2", name: "HYDRO 2", groupId: "hydro", capacityModifier: 88, shiftCount: 2 },
  
  // ASSEMBLAGE machines
  { id: "assemblage-1", name: "ASSEMBLAGE 1", groupId: "assemblage", capacityModifier: 100, shiftCount: 1 },
  { id: "assemblage-2", name: "ASSEMBLAGE 2", groupId: "assemblage", capacityModifier: 95, shiftCount: 2 },
  
  // LEAKTEST machines
  { id: "leaktest-1", name: "LEAKTEST 1", groupId: "leaktest", capacityModifier: 90, shiftCount: 2 },
  { id: "leaktest-2", name: "LEAKTEST 2", groupId: "leaktest", capacityModifier: 85, shiftCount: 1 },
];

export const capacityData = [
  { week: "Week 10", available: 480, required: 420 },
  { week: "Week 11", available: 480, required: 460 },
  { week: "Week 12", available: 480, required: 510 },
  { week: "Week 13", available: 480, required: 490 },
  { week: "Week 14", available: 480, required: 530 },
  { week: "Week 15", available: 480, required: 440 },
  { week: "Week 16", available: 480, required: 470 },
  { week: "Week 17", available: 480, required: 380 },
];

// ===== SCHEDULER DATA =====
export type OrderStatus = "planned" | "locked" | "near-deadline" | "late";

export interface SchedulerOrder {
  id: string;
  orderNumber: string;
  operation: string;
  machine: string;
  machineGroup: string;
  startDay: number;
  duration: number;
  status: OrderStatus;
  quantity: number;
  deadline: string;
  preferredWorkstation: string;
  bomStatus: "ok" | "risk";
}

export const schedulerOrders: SchedulerOrder[] = [
  { id: "1", orderNumber: "ORD-4501", operation: "Buigen eerste fase", machine: "BUIG 1", machineGroup: "BUIG", startDay: 0, duration: 3, status: "locked", quantity: 120, deadline: "2026-02-28", preferredWorkstation: "BUIG 1", bomStatus: "ok" },
  { id: "2", orderNumber: "ORD-4502", operation: "Buigen tweede fase", machine: "BUIG 2", machineGroup: "BUIG", startDay: 4, duration: 2, status: "planned", quantity: 80, deadline: "2026-03-05", preferredWorkstation: "BUIG 2", bomStatus: "ok" },
  { id: "3", orderNumber: "ORD-4510", operation: "Robotlassen", machine: "LASROBOT 1", machineGroup: "LASROBOT", startDay: 1, duration: 4, status: "near-deadline", quantity: 200, deadline: "2026-02-22", preferredWorkstation: "LASROBOT 1", bomStatus: "risk" },
  { id: "4", orderNumber: "ORD-4511", operation: "Handmatig lassen", machine: "LAS 1", machineGroup: "LAS", startDay: 6, duration: 2, status: "planned", quantity: 50, deadline: "2026-03-10", preferredWorkstation: "LAS 1", bomStatus: "ok" },
  { id: "5", orderNumber: "ORD-4520", operation: "Zagen", machine: "HYDRO 1", machineGroup: "HYDRO", startDay: 0, duration: 5, status: "locked", quantity: 300, deadline: "2026-03-01", preferredWorkstation: "HYDRO 1", bomStatus: "ok" },
  { id: "6", orderNumber: "ORD-4521", operation: "Assemblage", machine: "ASSEMBLAGE 1", machineGroup: "ASSEMBLAGE", startDay: 6, duration: 3, status: "late", quantity: 150, deadline: "2026-02-18", preferredWorkstation: "ASSEMBLAGE 1", bomStatus: "risk" },
  { id: "7", orderNumber: "ORD-4530", operation: "Lektest", machine: "LEAKTEST 1", machineGroup: "LEAKTEST", startDay: 2, duration: 4, status: "planned", quantity: 90, deadline: "2026-03-08", preferredWorkstation: "LEAKTEST 1", bomStatus: "ok" },
  { id: "8", orderNumber: "ORD-4540", operation: "Assemblage eindproduct", machine: "ASSEMBLAGE 2", machineGroup: "ASSEMBLAGE", startDay: 3, duration: 6, status: "near-deadline", quantity: 60, deadline: "2026-02-25", preferredWorkstation: "ASSEMBLAGE 2", bomStatus: "risk" },
  { id: "9", orderNumber: "ORD-4541", operation: "Robotlassen TIG", machine: "LASROBOT 2", machineGroup: "LASROBOT", startDay: 10, duration: 3, status: "planned", quantity: 40, deadline: "2026-03-15", preferredWorkstation: "LASROBOT 2", bomStatus: "ok" },
  { id: "10", orderNumber: "ORD-4550", operation: "Handmatig lassen MIG", machine: "LAS 2", machineGroup: "LAS", startDay: 1, duration: 2, status: "locked", quantity: 75, deadline: "2026-02-28", preferredWorkstation: "LAS 2", bomStatus: "ok" },
];

// ===== PLANBORD DATA =====
export interface PlanbordCard {
  id: string;
  orderNumber: string;
  operation: string;
  materialOk: boolean;
  duration: string;
  quantity: number;
  shift: string;
}

export const planbordCards: PlanbordCard[] = [
  { id: "p1", orderNumber: "ORD-4501", operation: "Buigen eerste fase", materialOk: true, duration: "4h", quantity: 120, shift: "today-1" },
  { id: "p2", orderNumber: "ORD-4520", operation: "Zagen", materialOk: true, duration: "6h", quantity: 300, shift: "today-1" },
  { id: "p3", orderNumber: "ORD-4550", operation: "Handmatig lassen MIG", materialOk: true, duration: "3h", quantity: 75, shift: "today-1" },
  { id: "p4", orderNumber: "ORD-4502", operation: "Buigen tweede fase", materialOk: true, duration: "5h", quantity: 80, shift: "today-2" },
  { id: "p5", orderNumber: "ORD-4530", operation: "Lektest", materialOk: true, duration: "4h", quantity: 90, shift: "today-2" },
  { id: "p6", orderNumber: "ORD-4510", operation: "Robotlassen", materialOk: false, duration: "7h", quantity: 200, shift: "tomorrow-1" },
  { id: "p7", orderNumber: "ORD-4540", operation: "Assemblage eindproduct", materialOk: false, duration: "8h", quantity: 60, shift: "tomorrow-1" },
  { id: "p8", orderNumber: "ORD-4521", operation: "Assemblage", materialOk: true, duration: "5h", quantity: 150, shift: "tomorrow-2" },
  { id: "p9", orderNumber: "ORD-4511", operation: "Handmatig lassen", materialOk: true, duration: "3h", quantity: 50, shift: "tomorrow-2" },
];

export const materialShortages = [
  { order: "ORD-4578", issue: "Stalen plaat ontbreekt" },
  { order: "ORD-4621", issue: "Lagers lage voorraad" },
  { order: "ORD-4510", issue: "Carbide inserts vertraagd" },
];
