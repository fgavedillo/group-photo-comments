
import { Card } from "@/components/ui/card";
import { Issue } from "@/types/issue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
  onAssignedEmailChange: (issueId: number, value: string) => void;
  isAdmin: boolean;
  isEditing?: boolean;
  securityImprovements: { [key: string]: string };
  actionPlans: { [key: string]: string };
  onSecurityImprovementChange: (issueId: number, value: string) => void;
  onActionPlanChange: (issueId: number, value: string) => void;
  onAddSecurityImprovement: (issueId: number) => void;
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
  isAdmin,
  isEditing = false,
  securityImprovements,
  actionPlans,
  onSecurityImprovementChange,
  onActionPlanChange,
  onAddSecurityImprovement,
}: IssueCardProps) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(isEditing);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localMessage, setLocalMessage] = useState(message);
  const [formState, setFormState] = useState({
    status: message.status,
    area: message.area || "",
    responsable: message.responsable || "",
    assigned_email: message.assignedEmail || "",
    security_improvement: message.securityImprovement || "",
    action_plan: message.actionPlan || ""
  });

  useEffect(() => {
    if (isEditing) {
      setIsEditDialogOpen(true);
    }
  }, [isEditing]);

  // Actualizar el estado local cuando cambia el mensaje externo
  useEffect(() => {
    setLocalMessage(message);
    setFormState({
      status: message.status,
      area: message.area || "",
      responsable: message.responsable || "",
      assigned_email: message.assignedEmail || "",
      security_improvement: message.securityImprovement || "",
      action_plan: message.actionPlan || ""
    });
  }, [message]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      console.log('Actualizando incidencia:', { id: message.id, formState });
      
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

      // Actualizar el estado local inmediatamente para reflejar los cambios
      setLocalMessage(prev => ({
        ...prev,
        status: formState.status,
        area: formState.area,
        responsable: formState.responsable,
        assignedEmail: formState.assigned_email,
        securityImprovement: formState.security_improvement,
        actionPlan: formState.action_plan
      }));

      // Notificar a los componentes padre
      onStatusChange(message.id, formState.status);
      onAreaChange(message.id, formState.area);
      onResponsableChange(message.id, formState.responsable);
      onAssignedEmailChange(message.id, formState.assigned_email);
      onSecurityImprovementChange(message.id, formState.security_improvement);
      onActionPlanChange(message.id, formState.action_plan);

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

  const handleFormStateChange = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

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
