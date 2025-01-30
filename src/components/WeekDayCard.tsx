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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-primary/5 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold capitalize text-lg text-primary">{dayName}</h3>
            <p className="text-sm text-muted-foreground">{dayNumber}</p>
          </div>
          <div className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border border-gray-100">
            {messages.length} incidencia{messages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      {messages.length > 0 ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="space-y-3">
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
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No hay incidencias registradas para este día
        </div>
      )}
    </div>
  );
};