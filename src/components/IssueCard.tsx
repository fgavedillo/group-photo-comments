import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ImageModal } from "./ImageModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IssueCardProps {
  message: any;
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

export const IssueCard = ({ 
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
  onAssignedEmailChange
}: IssueCardProps) => {
  const { toast } = useToast();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!message) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cerrada':
        return 'bg-green-100 border-green-300 shadow-[0_0_0_1px] shadow-green-300/50';
      case 'en-curso':
        return 'bg-yellow-100 border-yellow-300 shadow-[0_0_0_1px] shadow-yellow-300/50';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const handleDelete = async () => {
    try {
      if (message.imageUrl) {
        const { error: imageError } = await supabase
          .from('issue_images')
          .delete()
          .eq('issue_id', message.id);

        if (imageError) throw imageError;
      }

      const { error: issueError } = await supabase
        .from('issues')
        .delete()
        .eq('id', message.id);

      if (issueError) throw issueError;

      onDelete();
      
      toast({
        title: "Incidencia eliminada",
        description: "La incidencia se ha eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la incidencia",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Card className={cn("w-[200px] transition-all hover:shadow-md cursor-pointer flex-shrink-0", getStatusColor(message.status))}>
            <CardHeader className="relative p-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm text-primary">#{index + 1}</CardTitle>
                  <CardDescription className="text-xs">
                    {message.username}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {message.imageUrl && (
              <div className="px-3 pb-3">
                <button
                  className="w-full h-24 rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageModalOpen(true);
                  }}
                >
                  <img
                    src={message.imageUrl}
                    alt="Imagen de la incidencia"
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>
            )}
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Incidencia #{index + 1}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`area-${message.id}`}>Área</Label>
                <Input
                  id={`area-${message.id}`}
                  placeholder="Área responsable"
                  defaultValue={message.area || ''}
                  onChange={(e) => onAreaChange(message.id, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`responsable-${message.id}`}>Responsable</Label>
                <Input
                  id={`responsable-${message.id}`}
                  placeholder="Persona responsable"
                  defaultValue={message.responsable || ''}
                  onChange={(e) => onResponsableChange(message.id, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={message.status}
                onValueChange={(value) => onStatusChange(message.id, value as Issue['status'])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-estudio">En Estudio</SelectItem>
                  <SelectItem value="en-curso">En Curso</SelectItem>
                  <SelectItem value="cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Asignado</Label>
                <Input
                  placeholder="Email del responsable"
                  defaultValue={message.assigned_email || ''}
                  onChange={(e) => onAssignedEmailChange(message.id, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Mejora de Seguridad</Label>
                <Input
                  placeholder="Describe la mejora de seguridad"
                  value={securityImprovements[message.id] || ''}
                  onChange={(e) => onSecurityImprovementChange(message.id, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan de Acción</Label>
                <Input
                  placeholder="Describe el plan de acción"
                  value={actionPlans[message.id] || ''}
                  onChange={(e) => onActionPlanChange(message.id, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button 
                onClick={() => onAddSecurityImprovement(message.id)}
                className="w-full"
              >
                Guardar Mejora de Seguridad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageModal
        imageUrl={message.imageUrl}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La incidencia será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
