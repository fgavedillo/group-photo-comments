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
  const [selectedStates, setSelectedStates] = useState<string[]>(['en-estudio', 'en-curso', 'cerrada', 'denegado']);
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!messages || !Array.isArray(messages)) {
      console.log('No messages or invalid messages format');
      setFilteredMessages([]);
      return;
    }

    console.log('Selected states:', selectedStates);
    console.log('All messages:', messages);

    const filtered = messages.filter(message => {
      if (!message) return false;
      
      const status = message.status || 'en-estudio';
      const statusMatch = selectedStates.includes(status);
      
      console.log(`Message ${message.id} - Status: ${status}, Selected States: ${selectedStates.join(', ')}, Match: ${statusMatch}`);
      return statusMatch;
    });

    console.log('Filtered messages:', filtered);
    setFilteredMessages(filtered);
  }, [messages, selectedStates]);

  const handleStateToggle = (state: string) => {
    setSelectedStates(prev => {
      if (prev.includes(state)) {
        // Si es el último estado seleccionado, no permitimos deseleccionarlo
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== state);
      }
      return [...prev, state];
    });
  };

  const groupedDates = getGroupedDates(filteredMessages, groupBy);
  console.log('Grouped dates:', groupedDates);

  return (
    <div className="h-full bg-white/50 rounded-lg shadow-sm">
      <div className="sticky top-0 z-50 bg-white border-b">
        <IssueFilters
          groupBy={groupBy}
          selectedStates={selectedStates}
          onGroupByChange={setGroupBy}
          onStateToggle={handleStateToggle}
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