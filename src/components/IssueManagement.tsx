import { useIssues } from "@/hooks/useIssues";
import { useIssueActions } from "@/hooks/useIssueActions";
import { useIssueFilters } from "@/hooks/useIssueFilters";
import { IssueCard } from "./IssueCard";
import { SecurityImprovementForm } from "./SecurityImprovementForm";
import { EmailAssignmentForm } from "./EmailAssignmentForm";
import { IssueFilters } from "./IssueFilters";

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

  const handleMessageDelete = async (messageId: string) => {
    const updatedMessages = messages.filter(m => m.id !== messageId);
    return updatedMessages;
  };

  return (
    <div className="p-4 space-y-4">
      <IssueFilters
        areaFilter={areaFilter}
        responsableFilter={responsableFilter}
        onAreaFilterChange={setAreaFilter}
        onResponsableFilterChange={setResponsableFilter}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMessages.map((message, index) => (
          <IssueCard
            key={message.id}
            message={message}
            index={index}
            onStatusChange={handleStatusChange}
            onAreaChange={handleAreaChange}
            onResponsableChange={handleResponsableChange}
            onDelete={() => handleMessageDelete(message.id)}
          >
            <div className="space-y-4">
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
              />
            </div>
          </IssueCard>
        ))}
      </div>
    </div>
  );
};