import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IssueFiltersProps {
  groupBy: 'day' | 'week' | 'month';
  statusFilter: string;
  onGroupByChange: (value: 'day' | 'week' | 'month') => void;
  onStatusFilterChange: (value: string) => void;
}

export const IssueFilters = ({
  groupBy,
  statusFilter,
  onGroupByChange,
  onStatusFilterChange
}: IssueFiltersProps) => {
  return (
    <div className="flex justify-between items-center gap-4 p-4">
      <Select value={groupBy} onValueChange={onGroupByChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Agrupar por" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="day">Por día</SelectItem>
          <SelectItem value="week">Por semana</SelectItem>
          <SelectItem value="month">Por mes</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="en-estudio">En estudio</SelectItem>
          <SelectItem value="en-curso">En curso</SelectItem>
          <SelectItem value="cerrada">Cerrada</SelectItem>
          <SelectItem value="denegado">Denegado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};