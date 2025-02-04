import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IssueFiltersProps {
  groupBy: 'day' | 'week' | 'month';
  selectedStates: string[];
  onGroupByChange: (value: 'day' | 'week' | 'month') => void;
  onStateToggle: (state: string) => void;
}

const STATES = [
  { value: 'en-estudio', label: 'En estudio' },
  { value: 'en-curso', label: 'En curso' },
  { value: 'cerrada', label: 'Cerrada' },
  { value: 'denegado', label: 'Denegado' }
];

export const IssueFilters = ({
  groupBy,
  selectedStates,
  onGroupByChange,
  onStateToggle
}: IssueFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Agrupar por:</label>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((period) => (
            <Button
              key={period}
              variant={groupBy === period ? "default" : "outline"}
              onClick={() => onGroupByChange(period as 'day' | 'week' | 'month')}
              className="flex-1"
            >
              {period === 'day' ? 'Días' : period === 'week' ? 'Semanas' : 'Meses'}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estados:</label>
        <div className="flex flex-wrap gap-2">
          {STATES.map(({ value, label }) => (
            <Button
              key={value}
              variant={selectedStates.includes(value) ? "default" : "outline"}
              onClick={() => onStateToggle(value)}
              className={cn(
                "flex-1",
                selectedStates.includes(value) && "bg-primary"
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};