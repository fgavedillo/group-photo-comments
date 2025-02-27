
import { WeekDayCard } from "../WeekDayCard";
import { getGroupedDates } from "@/utils/dateUtils";
import { useIssueContext } from "./IssueContext";

interface IssueGroupedViewProps {
  filteredMessages: any[];
  groupBy: 'day' | 'week' | 'month';
  issueActions: {
    securityImprovements: { [key: string]: string };
    actionPlans: { [key: string]: string };
    handleStatusChange: (issueId: number, status: string) => void;
    handleAreaChange: (issueId: number, area: string) => void;
    handleResponsableChange: (issueId: number, responsable: string) => void;
    handleSecurityImprovementChange: (issueId: number, value: string) => void;
    handleActionPlanChange: (issueId: number, value: string) => void;
    handleAddSecurityImprovement: (issueId: number) => void;
    handleAssignedEmailChange: (issueId: number, value: string) => void;
  };
  onReload: () => void;
}

export const IssueGroupedView = ({
  filteredMessages,
  groupBy,
  issueActions,
  onReload,
}: IssueGroupedViewProps) => {
  const { isAdmin, editingIssueId } = useIssueContext();
  const groupedDates = getGroupedDates(filteredMessages, groupBy);

  return (
    <div className="px-4 pb-4 space-y-4 overflow-y-auto">
      {groupedDates.map((period) => (
        <WeekDayCard
          key={`${period.dayName}-${period.dayNumber}`}
          dayName={period.dayName}
          dayNumber={period.dayNumber}
          messages={period.messages}
          onStatusChange={issueActions.handleStatusChange}
          onAreaChange={issueActions.handleAreaChange}
          onResponsableChange={issueActions.handleResponsableChange}
          onDelete={onReload}
          securityImprovements={issueActions.securityImprovements}
          actionPlans={issueActions.actionPlans}
          onSecurityImprovementChange={issueActions.handleSecurityImprovementChange}
          onActionPlanChange={issueActions.handleActionPlanChange}
          onAddSecurityImprovement={issueActions.handleAddSecurityImprovement}
          onAssignedEmailChange={issueActions.handleAssignedEmailChange}
          isAdmin={isAdmin}
          editingIssueId={editingIssueId}
        />
      ))}
    </div>
  );
};
