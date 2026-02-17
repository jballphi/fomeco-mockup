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
    status: 'ok' | 'warning' | 'danger';
    staffingPercentage: number;
    color: string;
}

// Mock capacity overrides - periods where machines have different configurations
export const capacityOverrides: CapacityOverride[] = [
    {
        id: 'override-1',
        machineId: 'buig-1',
        startDate: '2026-03-01',
        endDate: '2026-03-14',
        capacityModifier: 60,
        shiftCount: 1,
        reason: 'Onderhoud gepland',
    },
    {
        id: 'override-2',
        machineId: 'lasrobot-1',
        startDate: '2026-02-24',
        endDate: '2026-02-28',
        capacityModifier: 50,
        shiftCount: 1,
        reason: 'Technische storing',
    },
    {
        id: 'override-3',
        machineId: 'hydro-2',
        startDate: '2026-04-01',
        endDate: '2026-04-07',
        capacityModifier: 100,
        shiftCount: 3,
        reason: 'Extra ploeg voor inhaalslag',
    },
];

// Mock staffing overrides - periods where groups have different staffing levels
export const staffingOverrides: StaffingOverride[] = [
    {
        id: 'staffing-1',
        groupId: 'lasrobot',
        startDate: '2026-03-10',
        endDate: '2026-03-24',
        staffingPercentage: 70,
        reason: 'Vakantieperiode - beperkte bezetting',
    },
    {
        id: 'staffing-2',
        groupId: 'buig',
        startDate: '2026-04-01',
        endDate: '2026-04-14',
        staffingPercentage: 110,
        reason: 'Extra personeel ingezet',
    },
];

export const machineGroups: MachineGroup[] = [
    { id: 'buig', name: 'BUIG', utilization: 87, status: 'ok', staffingPercentage: 95, color: 'hsl(214 80% 52%)' },
    {
        id: 'lasrobot',
        name: 'LASROBOT',
        utilization: 102,
        status: 'danger',
        staffingPercentage: 90,
        color: 'hsl(0 72% 51%)',
    },
    { id: 'las', name: 'LAS', utilization: 91, status: 'warning', staffingPercentage: 85, color: 'hsl(38 92% 50%)' },
    { id: 'hydro', name: 'HYDRO', utilization: 78, status: 'ok', staffingPercentage: 95, color: 'hsl(262 83% 58%)' },
    {
        id: 'assemblage',
        name: 'ASSEMBLAGE',
        utilization: 65,
        status: 'ok',
        staffingPercentage: 100,
        color: 'hsl(142 76% 36%)',
    },
    {
        id: 'leaktest',
        name: 'LEAKTEST',
        utilization: 73,
        status: 'ok',
        staffingPercentage: 90,
        color: 'hsl(173 80% 40%)',
    },
];

export const machines: Machine[] = [
    // BUIG machines
    { id: 'buig-1', name: 'BUIG 1', groupId: 'buig', capacityModifier: 85, shiftCount: 2 },
    { id: 'buig-2', name: 'BUIG 2', groupId: 'buig', capacityModifier: 90, shiftCount: 2 },
    { id: 'buig-3', name: 'BUIG 3', groupId: 'buig', capacityModifier: 80, shiftCount: 1 },

    // LASROBOT machines
    { id: 'lasrobot-1', name: 'LASROBOT 1', groupId: 'lasrobot', capacityModifier: 95, shiftCount: 3 },
    { id: 'lasrobot-2', name: 'LASROBOT 2', groupId: 'lasrobot', capacityModifier: 88, shiftCount: 2 },

    // LAS machines
    { id: 'las-1', name: 'LAS 1', groupId: 'las', capacityModifier: 80, shiftCount: 2 },
    { id: 'las-2', name: 'LAS 2', groupId: 'las', capacityModifier: 85, shiftCount: 2 },
    { id: 'las-3', name: 'LAS 3', groupId: 'las', capacityModifier: 90, shiftCount: 1 },

    // HYDRO machines
    { id: 'hydro-1', name: 'HYDRO 1', groupId: 'hydro', capacityModifier: 92, shiftCount: 2 },
    { id: 'hydro-2', name: 'HYDRO 2', groupId: 'hydro', capacityModifier: 88, shiftCount: 2 },

    // ASSEMBLAGE machines
    { id: 'assemblage-1', name: 'ASSEMBLAGE 1', groupId: 'assemblage', capacityModifier: 100, shiftCount: 1 },
    { id: 'assemblage-2', name: 'ASSEMBLAGE 2', groupId: 'assemblage', capacityModifier: 95, shiftCount: 2 },

    // LEAKTEST machines
    { id: 'leaktest-1', name: 'LEAKTEST 1', groupId: 'leaktest', capacityModifier: 90, shiftCount: 2 },
    { id: 'leaktest-2', name: 'LEAKTEST 2', groupId: 'leaktest', capacityModifier: 85, shiftCount: 1 },
];

export const capacityData = [
    { week: 'Week 10', available: 480, required: 420 },
    { week: 'Week 11', available: 480, required: 460 },
    { week: 'Week 12', available: 480, required: 510 },
    { week: 'Week 13', available: 480, required: 490 },
    { week: 'Week 14', available: 480, required: 530 },
    { week: 'Week 15', available: 480, required: 440 },
    { week: 'Week 16', available: 480, required: 470 },
    { week: 'Week 17', available: 480, required: 380 },
];

// ===== SCHEDULER DATA =====
export type OrderStatus = 'planned' | 'locked' | 'near-deadline' | 'late' | 'parked';

// Product types for different exhaust/chassis components
export type ProductType = 'TYPE_A' | 'TYPE_B' | 'TYPE_C' | 'TYPE_D';

export interface SchedulerOrder {
    id: string;
    orderNumber: string;
    productType: ProductType; // Product type determines setup requirements
    operation: string;
    machine: string;
    machineGroup: string;
    startHour: number; // Hour offset from start date (for precision)
    durationHours: number; // Duration in hours
    status: OrderStatus;
    quantity: number;
    deadline: string;
    preferredWorkstation: string;
    bomStatus: 'ok' | 'risk';
    parentOrderNumber?: string; // Links operations from same order
}

// Setup/conversion time matrix (in hours) - time needed to convert from one product type to another
// Key format: "FROM_TYPE-TO_TYPE"
export const setupTimeMatrix: Record<string, number> = {
    // Same type = minimal setup (cleaning/inspection only)
    'TYPE_A-TYPE_A': 0.5,
    'TYPE_B-TYPE_B': 0.5,
    'TYPE_C-TYPE_C': 0.5,
    'TYPE_D-TYPE_D': 0.5,

    // TYPE_A conversions (standard exhaust pipes)
    'TYPE_A-TYPE_B': 2.0, // Minor tooling change
    'TYPE_A-TYPE_C': 3.5, // Major tooling change + calibration
    'TYPE_A-TYPE_D': 4.0, // Complete reconfiguration

    // TYPE_B conversions (reinforced chassis tubes)
    'TYPE_B-TYPE_A': 2.5,
    'TYPE_B-TYPE_C': 2.0,
    'TYPE_B-TYPE_D': 3.0,

    // TYPE_C conversions (specialized exhaust manifolds)
    'TYPE_C-TYPE_A': 4.0,
    'TYPE_C-TYPE_B': 2.5,
    'TYPE_C-TYPE_D': 2.0,

    // TYPE_D conversions (custom chassis components)
    'TYPE_D-TYPE_A': 4.5,
    'TYPE_D-TYPE_B': 3.5,
    'TYPE_D-TYPE_C': 2.5,
};

export function getSetupTime(fromType: ProductType, toType: ProductType): number {
    const key = `${fromType}-${toType}`;
    return setupTimeMatrix[key] || 3.0; // Default 3 hours if not specified
}

// Helper function to generate realistic order data with hour precision
function generateSchedulerOrders(): SchedulerOrder[] {
  const orders: SchedulerOrder[] = [];
  const productTypes: ProductType[] = ["TYPE_A", "TYPE_B", "TYPE_C", "TYPE_D"];
  const operations = [
    { op: "Buigen", groups: ["BUIG"], machines: ["BUIG 1", "BUIG 2", "BUIG 3"] },
    { op: "Zagen", groups: ["HYDRO"], machines: ["HYDRO 1", "HYDRO 2"] },
    { op: "Robotlassen", groups: ["LASROBOT"], machines: ["LASROBOT 1", "LASROBOT 2"] },
    { op: "Handmatig lassen", groups: ["LAS"], machines: ["LAS 1", "LAS 2", "LAS 3"] },
    { op: "Assemblage", groups: ["ASSEMBLAGE"], machines: ["ASSEMBLAGE 1", "ASSEMBLAGE 2", "ASSEMBLAGE 3", "ASSEMBLAGE 4"] },
    { op: "Lektest", groups: ["LEAKTEST"], machines: ["LEAKTEST 1", "LEAKTEST 2"] },
  ];

  let orderId = 1;
  let orderNum = 4500;

  // Machine state tracking for realistic scheduling (in hours)
  const machineState: Record<string, { currentHour: number; lastProductType: ProductType | null }> = {};
  machines.forEach(m => {
    machineState[m.name] = { currentHour: 0, lastProductType: null };
  });

  // Generate orders with varied density
  // First 40 orders: tightly packed (high density in early timeline)
  // Next 10 orders: moderate spacing
  // Last 10 orders: spread out in future
  
  for (let i = 0; i < 60; i++) {
    const orderNumber = `ORD-${orderNum++}`;
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    const quantity = Math.floor(Math.random() * 250) + 50;
    
    // Determine density level
    let densityLevel: 'high' | 'medium' | 'low' = 'high';
    if (i >= 40 && i < 50) densityLevel = 'medium';
    else if (i >= 50) densityLevel = 'low';
    
    // Each order has 2-4 operations
    const numOps = Math.floor(Math.random() * 3) + 2;
    const selectedOps = [];
    const usedOpTypes = new Set<string>();
    
    // Pick unique operation types
    while (selectedOps.length < numOps) {
      const op = operations[Math.floor(Math.random() * operations.length)];
      if (!usedOpTypes.has(op.op)) {
        selectedOps.push(op);
        usedOpTypes.add(op.op);
      }
    }

    // Generate deadline based on density
    let deadlineDays: number;
    if (densityLevel === 'high') {
      deadlineDays = Math.floor(Math.random() * 20) + 5; // 5-25 days
    } else if (densityLevel === 'medium') {
      deadlineDays = Math.floor(Math.random() * 30) + 20; // 20-50 days
    } else {
      deadlineDays = Math.floor(Math.random() * 60) + 40; // 40-100 days
    }
    
    const deadlineDate = new Date(2026, 1, 16 + deadlineDays);
    const deadline = deadlineDate.toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // Status distribution
    let status: OrderStatus = "planned";
    const statusRoll = Math.random();
    if (statusRoll < 0.05) status = "late";
    else if (statusRoll < 0.15) status = "near-deadline";
    else if (statusRoll < 0.25) status = "locked";

    const bomStatus: "ok" | "risk" = Math.random() < 0.85 ? "ok" : "risk";

    let prevEndHour = 0;

    selectedOps.forEach((opDef, idx) => {
      const machine = opDef.machines[Math.floor(Math.random() * opDef.machines.length)];
      const machineGroup = opDef.groups[0];
      
      // Duration based on quantity (4-32 hours = 0.5-4 days)
      const durationHours = Math.max(4, Math.min(32, Math.ceil(quantity / 10)));
      
      // Initialize machine state if not exists
      if (!machineState[machine]) {
        machineState[machine] = { currentHour: 0, lastProductType: null };
      }
      
      // Find earliest available slot on this machine
      let startHour = machineState[machine].currentHour;
      
      // If product type changes, add setup time
      if (machineState[machine].lastProductType && machineState[machine].lastProductType !== productType) {
        const setupHours = getSetupTime(machineState[machine].lastProductType!, productType);
        startHour += setupHours;
      }

      // Ensure operations follow sequentially with gaps based on density
      if (idx > 0) {
        let gap = 0;
        if (densityLevel === 'high') gap = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 4); // 0-3 hour gap (tight)
        else if (densityLevel === 'medium') gap = Math.floor(Math.random() * 16); // 0-15 hour gap
        else gap = Math.floor(Math.random() * 48) + 24; // 24-72 hour gap
        
        startHour = Math.max(startHour, prevEndHour + gap);
      }

      orders.push({
        id: `${orderId++}`,
        orderNumber,
        parentOrderNumber: orderNumber,
        productType,
        operation: opDef.op,
        machine,
        machineGroup,
        startHour,
        durationHours,
        status,
        quantity,
        deadline,
        preferredWorkstation: machine,
        bomStatus,
      });

      // Update machine state
      machineState[machine].currentHour = startHour + durationHours;
      machineState[machine].lastProductType = productType;
      prevEndHour = startHour + durationHours;
    });
  }

  return orders.sort((a, b) => a.startHour - b.startHour);
}

// Extended scheduler orders with more data and product types
export const schedulerOrders: SchedulerOrder[] = generateSchedulerOrders();

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
    {
        id: 'p1',
        orderNumber: 'ORD-4501',
        operation: 'Buigen eerste fase',
        materialOk: true,
        duration: '4h',
        quantity: 120,
        shift: 'today-1',
    },
    {
        id: 'p2',
        orderNumber: 'ORD-4520',
        operation: 'Zagen',
        materialOk: true,
        duration: '6h',
        quantity: 300,
        shift: 'today-1',
    },
    {
        id: 'p3',
        orderNumber: 'ORD-4550',
        operation: 'Handmatig lassen MIG',
        materialOk: true,
        duration: '3h',
        quantity: 75,
        shift: 'today-1',
    },
    {
        id: 'p4',
        orderNumber: 'ORD-4502',
        operation: 'Buigen tweede fase',
        materialOk: true,
        duration: '5h',
        quantity: 80,
        shift: 'today-2',
    },
    {
        id: 'p5',
        orderNumber: 'ORD-4530',
        operation: 'Lektest',
        materialOk: true,
        duration: '4h',
        quantity: 90,
        shift: 'today-2',
    },
    {
        id: 'p6',
        orderNumber: 'ORD-4510',
        operation: 'Robotlassen',
        materialOk: false,
        duration: '7h',
        quantity: 200,
        shift: 'tomorrow-1',
    },
    {
        id: 'p7',
        orderNumber: 'ORD-4540',
        operation: 'Assemblage eindproduct',
        materialOk: false,
        duration: '8h',
        quantity: 60,
        shift: 'tomorrow-1',
    },
    {
        id: 'p8',
        orderNumber: 'ORD-4521',
        operation: 'Assemblage',
        materialOk: true,
        duration: '5h',
        quantity: 150,
        shift: 'tomorrow-2',
    },
    {
        id: 'p9',
        orderNumber: 'ORD-4511',
        operation: 'Handmatig lassen',
        materialOk: true,
        duration: '3h',
        quantity: 50,
        shift: 'tomorrow-2',
    },
];

export const materialShortages = [
    { order: 'ORD-4578', issue: 'Stalen plaat ontbreekt' },
    { order: 'ORD-4621', issue: 'Lagers lage voorraad' },
    { order: 'ORD-4510', issue: 'Carbide inserts vertraagd' },
];
