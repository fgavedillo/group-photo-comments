
import { Card } from "@/components/ui/card";
import { Issue } from "@/types/issue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IssueForm } from "./issues/IssueForm";
import { IssueHeader } from "./issues/IssueHeader";
import { IssueContent } from "./issues/IssueContent";

interface IssueCardProps {
  message: Issue;
  index: number;
  onStatusChange: (issueId: number, status: Issue['status']) => void;
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

const getStatusColor = (status: Issue['status']) => {
  switch (status) {
    case 'en-estudio':
      return 'border-yellow-500 bg-yellow-50';
    case 'en-curso':
      return 'border-blue-500 bg-blue-50';
    case 'cerrada':
      return 'border-green-500 bg-green-50';
    case 'denegado':
      return 'border-red-500 bg-red-50';
    default:
      return '';
  }
};

const IssueCard = ({
  message,
  index,
  onStatusChange,
  onAreaChange,
  onResponsableChange,
  onDelete,
  onAssignedEmailChange,
}: IssueCardProps) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formState, setFormState] = useState({
    status: message.status,
    area: message.area || "",
    responsable: message.responsable || "",
    assigned_email: message.assignedEmail || "",
    security_improvement: message.securityImprovement || "",
    action_plan: message.actionPlan || ""
  });

  const handleDelete = async () => {
    try {
      console.log('Attempting to delete issue:', message.id);
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', message.id);

      if (error) throw error;

      console.log('Issue deleted successfully');
      toast({
        title: "Incidencia eliminada",
        description: "La incidencia ha sido eliminada correctamente",
      });

      onDelete();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la incidencia",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { data, error } = await supabase
        .from('issues')
        .update({
          status: formState.status,
          area: formState.area,
          responsable: formState.responsable,
          assigned_email: formState.assigned_email,
          security_improvement: formState.security_improvement,
          action_plan: formState.action_plan
        })
        .eq('id', message.id)
        .select();

      if (error) throw error;

      onStatusChange(message.id, formState.status);
      onAreaChange(message.id, formState.area);
      onResponsableChange(message.id, formState.responsable);
      onAssignedEmailChange(message.id, formState.assigned_email);

      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado correctamente",
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFormStateChange = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className={cn("w-[350px] flex-shrink-0 relative border", getStatusColor(message.status))}>
      <IssueHeader
        username={message.username}
        timestamp={message.timestamp}
        isEditDialogOpen={isEditDialogOpen}
        onEditDialogChange={setIsEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        onDeleteDialogChange={setIsDeleteDialogOpen}
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
        message={message}
        imageUrl={message.imageUrl}
        onAssignedEmailChange={onAssignedEmailChange}
      />
    </Card>
  );
};

export default IssueCard;

