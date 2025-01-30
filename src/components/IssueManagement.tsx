import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { useIssueFilters } from "@/hooks/useIssueFilters";
import { IssueFilters } from "./IssueFilters";
import { WeekDayCard } from "./WeekDayCard";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";

export const IssueManagement = ({ messages }: { messages: any[] }) => {
  const { issues, loadIssues } = useIssues();
  const {
    securityImprovements,
    actionPlans,
    handleStatusChange,
    handleAreaChange,
    handleResponsableChange,
    handleSecurityImprovementChange,
    handleActionPlanChange,
    handleAddSecurityImprovement,
    handleAssignedEmailChange
  } = useIssueActions(loadIssues);

  const {
    areaFilter,
    responsableFilter,
    setAreaFilter,
    setResponsableFilter,
    filterIssues
  } = useIssueFilters();

  const filteredMessages = filterIssues(messages);
  const startDate = startOfWeek(new Date(), { locale: es });
  
  const weekDays = [...Array(7)].map((_, index) => {
    const date = addDays(startDate, index);
    return {
      date,
      dayName: format(date, 'EEEE', { locale: es }),
      dayNumber: format(date, 'd'),
      messages: filteredMessages.filter(message => 
        format(new Date(message.timestamp), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )
    };
  });

  return (
    <div className="space-y-2">
      <IssueFilters
        areaFilter={areaFilter}
        responsableFilter={responsableFilter}
        onAreaFilterChange={setAreaFilter}
        onResponsableFilterChange={setResponsableFilter}
      />
      
      <div className="flex flex-col gap-2">
        {weekDays.map((day) => (
          <WeekDayCard
            key={day.dayNumber}
            dayName={day.dayName}
            dayNumber={day.dayNumber}
            messages={day.messages}
            onStatusChange={handleStatusChange}
            onAreaChange={handleAreaChange}
            onResponsableChange={handleResponsableChange}
            onDelete={loadIssues}
            securityImprovements={securityImprovements}
            actionPlans={actionPlans}
            onSecurityImprovementChange={handleSecurityImprovementChange}
            onActionPlanChange={handleActionPlanChange}
            onAddSecurityImprovement={handleAddSecurityImprovement}
            onAssignedEmailChange={handleAssignedEmailChange}
          />
        ))}
      </div>
    </div>
  );
};