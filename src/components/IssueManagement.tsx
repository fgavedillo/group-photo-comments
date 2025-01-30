import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { useIssueFilters } from "@/hooks/useIssueFilters";
import { IssueCard } from "./IssueCard";
import { SecurityImprovementForm } from "./SecurityImprovementForm";
import { EmailAssignmentForm } from "./EmailAssignmentForm";
import { IssueFilters } from "./IssueFilters";
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

  // Obtener el inicio de la semana actual
  const startDate = startOfWeek(new Date(), { locale: es });
  
  // Crear array con los días de la semana
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
    <div className="container mx-auto py-2">
      <IssueFilters
        areaFilter={areaFilter}
        responsableFilter={responsableFilter}
        onAreaFilterChange={setAreaFilter}
        onResponsableFilterChange={setResponsableFilter}
      />
      
      <div className="grid grid-cols-7 gap-2 mt-4">
        {weekDays.map((day) => (
          <div key={day.dayNumber} className="flex flex-col">
            <div className="text-center mb-2">
              <div className="font-semibold capitalize">{day.dayName}</div>
              <div className="text-sm text-muted-foreground">{day.dayNumber}</div>
            </div>
            <div className="space-y-2">
              {day.messages.map((message, index) => (
                <IssueCard
                  key={message.id}
                  message={message}
                  index={index}
                  onStatusChange={handleStatusChange}
                  onAreaChange={handleAreaChange}
                  onResponsableChange={handleResponsableChange}
                  onDelete={loadIssues}
                >
                  <div className="space-y-2">
                    <EmailAssignmentForm
                      assignedEmail={message.assigned_email || ''}
                      onEmailChange={(value) => handleAssignedEmailChange(message.id, value)}
                      message={message.message}
                    />
                    
                    <SecurityImprovementForm
                      securityImprovement={securityImprovements[message.id] || ''}
                      actionPlan={actionPlans[message.id] || ''}
                      onSecurityImprovementChange={(value) => handleSecurityImprovementChange(message.id, value)}
                      onActionPlanChange={(value) => handleActionPlanChange(message.id, value)}
                      onSave={() => handleAddSecurityImprovement(message.id)}
                      message={message.message}
                    />
                  </div>
                </IssueCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};