

# Fomeco Production Planning System

## Overview
A professional, data-dense production planning web application for manufacturing planners, featuring three core modules: RCCP, Scheduler, and Planbord. Designed for large screens with an industrial SaaS aesthetic.

---

## Global Layout & Navigation

- **Left sidebar** — Dark vertical navigation with Fomeco logo, icons, and route links (Dashboard, RCCP, Scheduler, Planbord, Orders, Machines, Reports, Settings). Active item highlighted in industrial blue.
- **Top header bar** — Environment badge ("On-Prem – ERP Connected"), planning horizon selector (Week/2 Weeks/Month), Auto-Planning and Recalculate buttons, user profile indicator.
- **Theme** — Light grey background (#F5F6F8), white content panels with soft shadows, industrial blue accent, status colors (green/orange/red). Dense, compact layout optimized for 1440px+.

---

## Screen 1: RCCP (Rough-Cut Capacity Planning)

- **Capacity summary cards** — Total Available Hours, Total Required Hours, Capacity Gap %, Critical Machine Group (red if overloaded).
- **Weekly capacity bar chart** — Weeks on X-axis, hours on Y-axis. Blue bars for available capacity, orange/red overlay for required. Red highlight on overloaded weeks.
- **Right panel: Machine Group Configuration** — Dropdown for machine group, shift pattern inputs (shifts, start/end, staffing %), save button.
- **Mini utilization indicators** — Per machine group (e.g., Turning 87%, Milling 102% in red, Assembly 65%).

---

## Screen 2: Scheduler (Core Module)

- **Top filter bar** — Machine group and machine dropdowns, order search, time range toggle (Day/Week/2 Weeks/Month), "Show only late" toggle, Purge/Purge All/Lock/Unlock buttons.
- **Gantt chart** — Horizontal timeline across a 4-week horizon. Left column lists machines grouped by type. Shift blocks visible along the timeline. Order blocks as colored bars showing order number, operation, and duration. Color coding: blue (planned), green (locked), orange (near deadline), red (late). Lock icons on locked orders. First 2 shifts greyed out. Current-time vertical line and gridlines.
- **Right detail panel (collapsible)** — Shows selected order info: order number, quantity, deadline (with warning icon), preferred workstation, BOM/material status. Action buttons: Lock, Move Forward/Back, Split (disabled), Recalculate From Here. Validation warnings for deadline conflicts and material shortages.

---

## Screen 3: Planbord (Short-Term 2-Day View)

- **Kanban-style layout** — Columns: Today Shift 1, Today Shift 2, Tomorrow Shift 1, Tomorrow Shift 2. Each column contains draggable order cards.
- **Order cards** — Show order number, operation, material status dot (green/red), duration, quantity.
- **Top banner** — "Short-Term Plan – Material Aware".
- **Material warning panel** — Lists material shortages (e.g., "Order 4578 – Steel plate missing"). Red banner if conflicts exist.

---

## UX Details & Interactions

- Tooltips on hover over order blocks and cards
- Warning icons on overdue deadlines
- Confirmation modal before recalculating planning
- Toast notifications ("Planning successfully recalculated")
- Locked shifts visually shaded/greyed
- Drag-and-drop visual cues on Gantt and Planbord

---

## Data Approach

All screens will use realistic mock/sample data (no backend integration). Orders, machines, capacity figures, and material statuses will be hardcoded to create a fully populated, realistic-looking application.

---

## Implementation Order

1. Global layout (sidebar navigation, header bar, theme/colors)
2. RCCP dashboard (cards, bar chart, configuration panel)
3. Scheduler (filter bar, Gantt chart with mock data, detail panel)
4. Planbord (Kanban columns, order cards, material warnings)
5. UX polish (tooltips, modals, toasts, status indicators)

