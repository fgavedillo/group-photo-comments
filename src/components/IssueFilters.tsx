import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IssueFiltersProps {
  areaFilter: string;
  responsableFilter: string;
  onAreaFilterChange: (value: string) => void;
  onResponsableFilterChange: (value: string) => void;
}

export const IssueFilters = ({
  areaFilter,
  responsableFilter,
  onAreaFilterChange,
  onResponsableFilterChange
}: IssueFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="space-y-2">
        <Label htmlFor="area-filter">Filtrar por Área</Label>
        <Input
          id="area-filter"
          placeholder="Buscar por área..."
          value={areaFilter}
          onChange={(e) => onAreaFilterChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="responsable-filter">Filtrar por Responsable</Label>
        <Input
          id="responsable-filter"
          placeholder="Buscar por responsable..."
          value={responsableFilter}
          onChange={(e) => onResponsableFilterChange(e.target.value)}
        />
      </div>
    </div>
  );
};