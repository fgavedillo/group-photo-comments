
import { IssueFilters } from "../IssueFilters";

interface IssueFiltersSectionProps {
  groupBy: 'day' | 'week' | 'month';
  selectedStates: string[];
  responsableFilter: string;
  onGroupByChange: (value: 'day' | 'week' | 'month') => void;
  onStateToggle: (state: string) => void;
  onResponsableFilterChange: (value: string) => void;
}

export const IssueFiltersSection = ({
  groupBy,
  selectedStates,
  responsableFilter,
  onGroupByChange,
  onStateToggle,
  onResponsableFilterChange,
}: IssueFiltersSectionProps) => {
  return (
    <div className="sticky top-0 z-50 bg-white border-b">
      <IssueFilters
        groupBy={groupBy}
        selectedStates={selectedStates}
        responsableFilter={responsableFilter}
        onGroupByChange={(value) => {
          console.log('Changing groupBy to:', value);
          onGroupByChange(value);
        }}
        onStateToggle={onStateToggle}
        onResponsableFilterChange={onResponsableFilterChange}
      />
    </div>
  );
};
