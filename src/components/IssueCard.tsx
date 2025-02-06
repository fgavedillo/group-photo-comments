import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EmailAssignmentForm } from "./EmailAssignmentForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageModal } from "./ImageModal";

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

const IssueCard = ({
  message,
  index,
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
}: IssueCardProps) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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

      if (error) {
        console.error('Error deleting issue:', error);
        throw error;
      }

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

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
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

  const IssueForm = () => (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={formState.status}
          onValueChange={(value) => {
            setFormState(prev => ({ ...prev, status: value as Issue['status'] }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="en-estudio">En estudio</SelectItem>
            <SelectItem value="en-curso">En curso</SelectItem>
            <SelectItem value="cerrada">Cerrada</SelectItem>
            <SelectItem value="denegado">Denegado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Área</Label>
        <Input
          type="text"
          value={formState.area}
          onChange={(e) => {
            setFormState(prev => ({ ...prev, area: e.target.value }));
          }}
          placeholder="Ingrese el área"
        />
      </div>

      <div className="space-y-2">
        <Label>Responsable</Label>
        <Input
          type="text"
          value={formState.responsable}
          onChange={(e) => {
            setFormState(prev => ({ ...prev, responsable: e.target.value }));
          }}
          placeholder="Nombre del responsable"
        />
      </div>

      <div className="space-y-2">
        <Label>Email asignado</Label>
        <Input
          type="email"
          value={formState.assigned_email}
          onChange={(e) => {
            setFormState(prev => ({ ...prev, assigned_email: e.target.value }));
          }}
          placeholder="ejemplo@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Mejora de seguridad</Label>
        <Textarea
          value={formState.security_improvement}
          onChange={(e) => {
            setFormState(prev => ({ ...prev, security_improvement: e.target.value }));
          }}
          placeholder="Describe la mejora de seguridad..."
          className="min-h-[100px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label>Plan de acción</Label>
        <Textarea
          value={formState.action_plan}
          onChange={(e) => {
            setFormState(prev => ({ ...prev, action_plan: e.target.value }));
          }}
          placeholder="Describe el plan de acción..."
          className="min-h-[100px] resize-y"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );

  return (
    <Card className={cn("w-[350px] flex-shrink-0 relative border", getStatusColor(message.status))}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{message.username}</CardTitle>
            <CardDescription>
              {new Date(message.timestamp).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle>Editar incidencia</DialogTitle>
                </DialogHeader>
                <IssueForm />
              </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la incidencia.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {message.imageUrl && (
          <div className="mb-4">
            <div 
              className="cursor-pointer" 
              onClick={() => setIsImageModalOpen(true)}
            >
              <img
                src={message.imageUrl}
                alt="Issue"
                className="w-full h-32 object-cover rounded-md"
              />
            </div>
            <ImageModal
              imageUrl={message.imageUrl}
              isOpen={isImageModalOpen}
              onClose={() => setIsImageModalOpen(false)}
            />
          </div>
        )}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Estado: <span className="font-medium text-foreground">{message.status}</span></p>
          {message.area && <p>Área: <span className="font-medium text-foreground">{message.area}</span></p>}
          {message.responsable && <p>Responsable: <span className="font-medium text-foreground">{message.responsable}</span></p>}
          {message.securityImprovement && (
            <p>Mejora de seguridad: <span className="font-medium text-foreground">{message.securityImprovement}</span></p>
          )}
          {message.actionPlan && (
            <p>Plan de acción: <span className="font-medium text-foreground">{message.actionPlan}</span></p>
          )}
        </div>
        
        <div className="mt-4">
          <EmailAssignmentForm
            assignedEmail={message.assignedEmail || ""}
            onEmailChange={(email) => onAssignedEmailChange(message.id, email)}
            message={message.message}
            imageUrl={message.imageUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IssueCard;