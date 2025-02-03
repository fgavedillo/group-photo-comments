import { useState, useEffect } from "react";
import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { WeekDayCard } from "./WeekDayCard";
import { IssueFilters } from "./IssueFilters";
import { getGroupedDates } from "@/utils/dateUtils";

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

  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!messages || !Array.isArray(messages)) {
      console.log('No messages or invalid messages format');
      setFilteredMessages([]);
      return;
    }

    console.log('Current status filter:', statusFilter);
    console.log('All messages:', messages);

    const filtered = messages.filter(message => {
      if (!message) return false;
      
      const status = message.status || 'en-estudio'; // Default status if undefined
      const statusMatch = statusFilter === 'all' || status === statusFilter;
      
      console.log(`Message ${message.id} - Status: ${status}, Filter: ${statusFilter}, Match: ${statusMatch}`);
      return statusMatch;
    });

    console.log('Filtered messages:', filtered);
    setFilteredMessages(filtered);
  }, [messages, statusFilter]);

  const handleFilterChange = (status: string) => {
    console.log('Setting status filter to:', status);
    setStatusFilter(status);
  };

  const handleGroupByChange = (value: 'day' | 'week' | 'month') => {
    console.log('Setting group by to:', value);
    setGroupBy(value);
  };

  const groupedDates = getGroupedDates(filteredMessages, groupBy);
  console.log('Grouped dates:', groupedDates);

  return (
    <div className="h-full bg-white/50 rounded-lg shadow-sm">
      <div className="sticky top-0 z-50 bg-white border-b">
        <IssueFilters
          groupBy={groupBy}
          statusFilter={statusFilter}
          onGroupByChange={handleGroupByChange}
          onStatusFilterChange={handleFilterChange}
        />
      </div>
      
      <div className="px-4 pb-4 space-y-4 overflow-y-auto">
        {groupedDates.map((period) => (
          <WeekDayCard
            key={`${period.dayName}-${period.dayNumber}`}
            dayName={period.dayName}
            dayNumber={period.dayNumber}
            messages={period.messages}
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