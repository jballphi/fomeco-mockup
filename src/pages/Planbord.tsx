import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { planbordCards, materialShortages, type PlanbordCard } from "@/data/mockData";

const shifts = [
  { key: "today-1", label: "Today — Shift 1" },
  { key: "today-2", label: "Today — Shift 2" },
  { key: "tomorrow-1", label: "Tomorrow — Shift 1" },
  { key: "tomorrow-2", label: "Tomorrow — Shift 2" },
];

function OrderCard({ card }: { card: PlanbordCard }) {
  return (
    <Card className="mb-2 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">{card.orderNumber}</span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${card.materialOk ? "bg-status-ok" : "bg-status-danger"}`}
            title={card.materialOk ? "Material OK" : "Material issue"}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">{card.operation}</p>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{card.duration}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            Qty {card.quantity}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Planbord() {
  const hasShortages = materialShortages.length > 0;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Planbord — Short-Term Plan</h1>
        <Badge variant="outline" className="text-xs gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-status-ok inline-block" />
          Material Aware
        </Badge>
      </div>

      {/* Material warning */}
      {hasShortages && (
        <Card className="border-status-danger/30 bg-status-danger/5">
          <CardContent className="py-2.5 px-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-status-danger shrink-0" />
              <span className="text-sm font-medium text-status-danger">Material Shortages Detected</span>
            </div>
            <ul className="space-y-0.5 text-xs text-foreground ml-6">
              {materialShortages.map((s) => (
                <li key={s.order}>
                  <span className="font-medium">{s.order}</span> — {s.issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-3">
        {shifts.map((shift) => {
          const cards = planbordCards.filter((c) => c.shift === shift.key);
          return (
            <div key={shift.key}>
              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">{shift.label}</div>
              <div className="bg-muted/40 rounded-lg p-2 min-h-[300px]">
                {cards.map((card) => (
                  <OrderCard key={card.id} card={card} />
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No orders</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
