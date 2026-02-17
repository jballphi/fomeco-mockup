import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Zap, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HeaderBar() {
  const { toast } = useToast();

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Badge
          variant="outline"
          className="text-xs font-normal bg-muted border-border text-muted-foreground gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-status-ok inline-block" />
          On-Prem – ERP Connected
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() =>
            toast({ title: 'Auto-Planning started', description: 'Optimizing production schedule…' })
          }
        >
          <Zap className="h-3.5 w-3.5" />
          Auto-Plan
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() =>
            toast({ title: 'Planning recalculated', description: 'All constraints re-evaluated.' })
          }
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recalculate
        </Button>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center ml-1">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
