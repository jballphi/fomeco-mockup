import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Placeholder() {
  const location = useLocation();
  const name = location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-sm">
        <CardContent className="py-10 text-center space-y-2">
          <Construction className="h-8 w-8 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">This module is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
