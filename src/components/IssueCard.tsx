
import { Card } from "@/components/ui/card";
import { Issue } from "@/types/issue";
import { cn } from "@/lib/utils";
import { IssueForm } from "./issues/IssueForm";
import { IssueHeader } from "./issues/IssueHeader";
import { IssueContent } from "./issues/IssueContent";
import { useIssueCardState } from "@/hooks/useIssueCardState";
import { getStatusColor } from "@/utils/issueUtils";

interface IssueCardProps {
  message: Issue;
  index: number;
  onStatusChange: (issueId: number, status: Issue['status']) => void;
  onAreaChange: (issueId: number, area: string) => void;
  onResponsableChange: (issueId: number, responsable: string) => void;
  onDelete: () => void;
  onAssignedEmailChange: (issueId: number, value: string) => void;
  isAdmin: boolean;
  isEditing?: boolean;
  securityImprovements: { [key: string]: string };
  actionPlans: { [key: string]: string };
  onSecurityImprovementChange: (issueId: number, value: string) => void;
  onActionPlanChange: (issueId: number, value: string) => void;
  onAddSecurityImprovement: (issueId: number) => void;
}

const IssueCard = ({
  message,
  index,
  onStatusChange,
  onAreaChange,
  onResponsableChange,
  onDelete,
  onAssignedEmailChange,
  isAdmin,
  isEditing = false,
  securityImprovements,
  actionPlans,
  onSecurityImprovementChange,
  onActionPlanChange,
  onAddSecurityImprovement,
}: IssueCardProps) => {
  const [
    { isDeleteDialogOpen, isEditDialogOpen, isUpdating, localMessage, formState },
    { setIsDeleteDialogOpen, setIsEditDialogOpen, handleFormStateChange, handleFormSubmit, handleDelete }
  ] = useIssueCardState(
    message,
    isEditing,
    onStatusChange,
    onAreaChange,
    onResponsableChange,
    onAssignedEmailChange,
    onSecurityImprovementChange,
    onActionPlanChange,
    onDelete
  );

  return (
    <Card className={cn("w-[350px] flex-shrink-0 relative border", getStatusColor(localMessage.status))}>
      <IssueHeader
        username={localMessage.username}
        timestamp={localMessage.timestamp}
        isEditDialogOpen={isEditDialogOpen}
        onEditDialogChange={setIsEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        onDeleteDialogChange={setIsDeleteDialogOpen}
        onDelete={handleDelete}
      >
        <IssueForm
          formState={formState}
          isUpdating={isUpdating}
          onFormSubmit={handleFormSubmit}
          onFormStateChange={handleFormStateChange}
          onCancel={() => setIsEditDialogOpen(false)}
        />
      </IssueHeader>

      <IssueContent
        message={localMessage}
        imageUrl={localMessage.imageUrl}
        onAssignedEmailChange={onAssignedEmailChange}
      />
    </Card>
  );
};

export default IssueCard;
