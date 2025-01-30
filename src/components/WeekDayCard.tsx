import { IssueCard } from "./IssueCard";
import { EmailAssignmentForm } from "./EmailAssignmentForm";
import { SecurityImprovementForm } from "./SecurityImprovementForm";

interface WeekDayCardProps {
  dayName: string;
  dayNumber: string;
  messages: any[];
  onStatusChange: (issueId: number, status: string) => void;
  onAreaChange: (issueId: number, area: string) => void;
  onResponsableChange: (issueId: number, responsable: string) => void;
  onDelete: () => void;
  securityImprovements: { [key: string]: string };
  actionPlans: { [key: string]: string };
  onSecurityImprovementChange: (issueId: number, value: string) => void;
  onActionPlanChange: (issueId: number, value: string) => void;
  onAddSecurityImprovement: (issueId: number) => void;
  onAssignedEmailChange: (issueId: number, value: string) => void;
}

export const WeekDayCard = ({
  dayName,
  dayNumber,
  messages,
  onStatusChange,
  onAreaChange,
  onResponsableChange,
  onDelete,
  securityImprovements,
  actionPlans,
  onSecurityImprovementChange,
  onActionPlanChange,
  onAddSecurityImprovement,
  onAssignedEmailChange,
}: WeekDayCardProps) => {
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold capitalize text-lg">{dayName}</h3>
          <p className="text-sm text-muted-foreground">{dayNumber}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {messages.length} incidencia{messages.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {messages.map((message, index) => (
          <IssueCard
            key={message.id}
            message={message}
            index={index}
            onStatusChange={onStatusChange}
            onAreaChange={onAreaChange}
            onResponsableChange={onResponsableChange}
            onDelete={onDelete}
          >
            <div className="space-y-2">
              <EmailAssignmentForm
                assignedEmail={message.assigned_email || ''}
                onEmailChange={(value) => onAssignedEmailChange(message.id, value)}
                message={message.message}
              />
              
              <SecurityImprovementForm
                securityImprovement={securityImprovements[message.id] || ''}
                actionPlan={actionPlans[message.id] || ''}
                onSecurityImprovementChange={(value) => onSecurityImprovementChange(message.id, value)}
                onActionPlanChange={(value) => onActionPlanChange(message.id, value)}
                onSave={() => onAddSecurityImprovement(message.id)}
                message={message.message}
              />
            </div>
          </IssueCard>
        ))}
      </div>
    </div>
  );
};