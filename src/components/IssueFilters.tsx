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
  return null; // Remove the filters from the UI but keep the component for future use if needed
};