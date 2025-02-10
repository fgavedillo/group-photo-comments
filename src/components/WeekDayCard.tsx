
import IssueCard from "./IssueCard";
import { cn } from "@/lib/utils";

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
  isAdmin: boolean;
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
  isAdmin,
}: WeekDayCardProps) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4">
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
      <div className="p-4">
        {messages.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {messages.map((message, index) => (
              <IssueCard
                key={message.id}
                message={message}
                index={index}
                onStatusChange={onStatusChange}
                onAreaChange={onAreaChange}
                onResponsableChange={onResponsableChange}
                onDelete={onDelete}
                securityImprovements={securityImprovements}
                actionPlans={actionPlans}
                onSecurityImprovementChange={onSecurityImprovementChange}
                onActionPlanChange={onActionPlanChange}
                onAddSecurityImprovement={onAddSecurityImprovement}
                onAssignedEmailChange={onAssignedEmailChange}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No hay incidencias registradas para este día
          </div>
        )}
      </div>
    </div>
  );
};
