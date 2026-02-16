// ===== RCCP DATA =====
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

export const machineGroups = [
  { name: "Turning", utilization: 87, status: "ok" as const },
  { name: "Milling", utilization: 102, status: "danger" as const },
  { name: "Assembly", utilization: 65, status: "ok" as const },
  { name: "Welding", utilization: 91, status: "warning" as const },
  { name: "Grinding", utilization: 78, status: "ok" as const },
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
  { id: "1", orderNumber: "ORD-4501", operation: "Rough milling", machine: "Milling 01", machineGroup: "Milling", startDay: 0, duration: 3, status: "locked", quantity: 120, deadline: "2026-02-28", preferredWorkstation: "Milling 01", bomStatus: "ok" },
  { id: "2", orderNumber: "ORD-4502", operation: "Finish milling", machine: "Milling 01", machineGroup: "Milling", startDay: 4, duration: 2, status: "planned", quantity: 80, deadline: "2026-03-05", preferredWorkstation: "Milling 01", bomStatus: "ok" },
  { id: "3", orderNumber: "ORD-4510", operation: "Side milling", machine: "Milling 02", machineGroup: "Milling", startDay: 1, duration: 4, status: "near-deadline", quantity: 200, deadline: "2026-02-22", preferredWorkstation: "Milling 02", bomStatus: "risk" },
  { id: "4", orderNumber: "ORD-4511", operation: "Slot milling", machine: "Milling 02", machineGroup: "Milling", startDay: 6, duration: 2, status: "planned", quantity: 50, deadline: "2026-03-10", preferredWorkstation: "Milling 02", bomStatus: "ok" },
  { id: "5", orderNumber: "ORD-4520", operation: "CNC turning", machine: "Turning 01", machineGroup: "Turning", startDay: 0, duration: 5, status: "locked", quantity: 300, deadline: "2026-03-01", preferredWorkstation: "Turning 01", bomStatus: "ok" },
  { id: "6", orderNumber: "ORD-4521", operation: "Threading", machine: "Turning 01", machineGroup: "Turning", startDay: 6, duration: 3, status: "late", quantity: 150, deadline: "2026-02-18", preferredWorkstation: "Turning 01", bomStatus: "risk" },
  { id: "7", orderNumber: "ORD-4530", operation: "Facing", machine: "Turning 02", machineGroup: "Turning", startDay: 2, duration: 4, status: "planned", quantity: 90, deadline: "2026-03-08", preferredWorkstation: "Turning 02", bomStatus: "ok" },
  { id: "8", orderNumber: "ORD-4540", operation: "Final assembly", machine: "Assembly 01", machineGroup: "Assembly", startDay: 3, duration: 6, status: "near-deadline", quantity: 60, deadline: "2026-02-25", preferredWorkstation: "Assembly 01", bomStatus: "risk" },
  { id: "9", orderNumber: "ORD-4541", operation: "Sub-assembly", machine: "Assembly 01", machineGroup: "Assembly", startDay: 10, duration: 3, status: "planned", quantity: 40, deadline: "2026-03-15", preferredWorkstation: "Assembly 01", bomStatus: "ok" },
  { id: "10", orderNumber: "ORD-4550", operation: "MIG welding", machine: "Welding 01", machineGroup: "Welding", startDay: 1, duration: 2, status: "locked", quantity: 75, deadline: "2026-02-28", preferredWorkstation: "Welding 01", bomStatus: "ok" },
];

export const machines = [
  { name: "Milling 01", group: "Milling" },
  { name: "Milling 02", group: "Milling" },
  { name: "Turning 01", group: "Turning" },
  { name: "Turning 02", group: "Turning" },
  { name: "Assembly 01", group: "Assembly" },
  { name: "Welding 01", group: "Welding" },
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
  { id: "p1", orderNumber: "ORD-4501", operation: "Rough milling", materialOk: true, duration: "4h", quantity: 120, shift: "today-1" },
  { id: "p2", orderNumber: "ORD-4520", operation: "CNC turning", materialOk: true, duration: "6h", quantity: 300, shift: "today-1" },
  { id: "p3", orderNumber: "ORD-4550", operation: "MIG welding", materialOk: true, duration: "3h", quantity: 75, shift: "today-1" },
  { id: "p4", orderNumber: "ORD-4502", operation: "Finish milling", materialOk: true, duration: "5h", quantity: 80, shift: "today-2" },
  { id: "p5", orderNumber: "ORD-4530", operation: "Facing", materialOk: true, duration: "4h", quantity: 90, shift: "today-2" },
  { id: "p6", orderNumber: "ORD-4510", operation: "Side milling", materialOk: false, duration: "7h", quantity: 200, shift: "tomorrow-1" },
  { id: "p7", orderNumber: "ORD-4540", operation: "Final assembly", materialOk: false, duration: "8h", quantity: 60, shift: "tomorrow-1" },
  { id: "p8", orderNumber: "ORD-4521", operation: "Threading", materialOk: true, duration: "5h", quantity: 150, shift: "tomorrow-2" },
  { id: "p9", orderNumber: "ORD-4511", operation: "Slot milling", materialOk: true, duration: "3h", quantity: 50, shift: "tomorrow-2" },
];

export const materialShortages = [
  { order: "ORD-4578", issue: "Steel plate missing" },
  { order: "ORD-4621", issue: "Bearings low stock" },
  { order: "ORD-4510", issue: "Carbide inserts delayed" },
];
