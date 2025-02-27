
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
  console.log('IssueFiltersSection - props:', {
    responsableFilter
  });
  
  return (
    <div className="sticky top-0 z-50 bg-white border-b">
      <IssueFilters
        groupBy={groupBy}
        selectedStates={selectedStates}
        responsableFilter={responsableFilter}
        onGroupByChange={(value) => {
          console.log('IssueFiltersSection - Changing groupBy to:', value);
          onGroupByChange(value);
        }}
        onStateToggle={(state) => {
          console.log('IssueFiltersSection - Toggling state:', state);
          onStateToggle(state);
        }}
        onResponsableFilterChange={(value) => {
          console.log('IssueFiltersSection - Changing responsable filter to:', value);
          onResponsableFilterChange(value);
        }}
      />
    </div>
  );
};
