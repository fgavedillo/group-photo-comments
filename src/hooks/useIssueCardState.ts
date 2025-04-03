
import { useState, useEffect } from "react";
import { Issue } from "@/types/issue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IssueCardState {
  isDeleteDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isUpdating: boolean;
  localMessage: Issue;
  formState: {
    status: Issue['status'];
    area: string;
    responsable: string;
    assigned_email: string;
    security_improvement: string;
    action_plan: string;
  };
}

interface IssueCardActions {
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  handleFormStateChange: (field: keyof IssueCardState['formState'], value: string) => void;
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export const useIssueCardState = (
  message: Issue,
  isEditing: boolean,
  onStatusChange: (issueId: number, status: Issue['status']) => void,
  onAreaChange: (issueId: number, area: string) => void,
  onResponsableChange: (issueId: number, responsable: string) => void,
  onAssignedEmailChange: (issueId: number, value: string) => void,
  onSecurityImprovementChange: (issueId: number, value: string) => void,
  onActionPlanChange: (issueId: number, value: string) => void,
  onDelete: () => void
): [IssueCardState, IssueCardActions] => {
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

  // Update local state when external message changes
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

  const handleFormStateChange = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      console.log('Updating issue:', { id: message.id, formState });
      
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

      // Update local state immediately to reflect changes
      setLocalMessage(prev => ({
        ...prev,
        status: formState.status,
        area: formState.area,
        responsable: formState.responsable,
        assignedEmail: formState.assigned_email,
        securityImprovement: formState.security_improvement,
        actionPlan: formState.action_plan
      }));

      // Notify parent components
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

  return [
    { isDeleteDialogOpen, isEditDialogOpen, isUpdating, localMessage, formState },
    { setIsDeleteDialogOpen, setIsEditDialogOpen, handleFormStateChange, handleFormSubmit, handleDelete }
  ];
};
