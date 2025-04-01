/**
 * Hook personalizado para gestionar el estado y acciones de una tarjeta de incidencia
 * Maneja operaciones como edición, actualización y eliminación de incidencias
 */
import { useState, useEffect, FormEvent } from "react";
import { Issue } from "@/types/issue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Interfaz que define el estado interno de una tarjeta de incidencia
 */
interface IssueCardState {
  /** Indica si el diálogo de confirmación de eliminación está abierto */
  isDeleteDialogOpen: boolean;
  /** Indica si el diálogo de edición está abierto */
  isEditDialogOpen: boolean;
  /** Indica si hay una operación de actualización en curso */
  isUpdating: boolean;
  /** Copia local de la incidencia para manejo de UI */
  localMessage: Issue;
  /** Estado del formulario de edición */
  formState: {
    /** Estado actual de la incidencia (en-estudio, en-curso, etc.) */
    status: Issue['status'];
    /** Área relacionada con la incidencia */
    area: string;
    /** Persona responsable de la incidencia */
    responsable: string;
    /** Correo electrónico asignado a la incidencia para notificaciones y seguimiento */
    assigned_email: string;
    /** Mejora de seguridad propuesta */
    security_improvement: string;
    /** Plan de acción para resolver la incidencia */
    action_plan: string;
  };
}

/**
 * Interfaz que define las acciones disponibles para una tarjeta de incidencia
 */
interface IssueCardActions {
  /** Cambia el estado del diálogo de eliminación */
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  /** Cambia el estado del diálogo de edición */
  setIsEditDialogOpen: (isOpen: boolean) => void;
  /** Actualiza un campo específico del formulario */
  handleFormStateChange: (field: keyof IssueCardState['formState'], value: string) => void;
  /** Maneja el envío del formulario para guardar cambios */
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  /** Elimina la incidencia */
  handleDelete: () => Promise<void>;
}

/**
 * Hook que proporciona estado y funcionalidades para gestionar una tarjeta de incidencia
 * 
 * @param message - La incidencia a gestionar
 * @param isEditing - Indica si la incidencia está en modo de edición
 * @param onStatusChange - Callback para notificar cambios en el estado
 * @param onAreaChange - Callback para notificar cambios en el área
 * @param onResponsableChange - Callback para notificar cambios en el responsable
 * @param onAssignedEmailChange - Callback para notificar cambios en el email asignado
 * @param onSecurityImprovementChange - Callback para notificar cambios en la mejora de seguridad
 * @param onActionPlanChange - Callback para notificar cambios en el plan de acción
 * @param onDelete - Callback a ejecutar cuando se elimina la incidencia
 * @returns Tupla con el estado y las acciones disponibles
 */
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

  // Abrir diálogo de edición si se inicia en modo edición
  useEffect(() => {
    if (isEditing) {
      setIsEditDialogOpen(true);
    }
  }, [isEditing]);

  // Actualizar estado local cuando cambia la incidencia externamente
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

  /**
   * Actualiza un campo específico del formulario
   * @param field - Nombre del campo a actualizar
   * @param value - Nuevo valor para el campo
   */
  const handleFormStateChange = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Maneja el envío del formulario y actualiza la incidencia en la base de datos
   * @param e - Evento del formulario
   */
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      console.log('Updating issue:', { id: message.id, formState });
      
      // Actualizar la incidencia en la base de datos
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

      // Notificar a los componentes padre sobre los cambios
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

  /**
   * Elimina la incidencia de la base de datos
   */
  const handleDelete = async () => {
    try {
      console.log('Attempting to delete issue:', message.id);
      
      // Eliminar la incidencia de la base de datos
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

      // Ejecutar el callback de eliminación
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

  // Retornar estado y acciones como una tupla
  return [
    { isDeleteDialogOpen, isEditDialogOpen, isUpdating, localMessage, formState },
    { setIsDeleteDialogOpen, setIsEditDialogOpen, handleFormStateChange, handleFormSubmit, handleDelete }
  ];
};
